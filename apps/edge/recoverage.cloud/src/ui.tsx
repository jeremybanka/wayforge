import type { Endpoints } from "@octokit/types"
import { type } from "arktype"
import { and, eq } from "drizzle-orm"
import type { DrizzleD1Database } from "drizzle-orm/d1"
import type { MiddlewareHandler } from "hono"
import { Hono } from "hono"
import { deleteCookie, getSignedCookie } from "hono/cookie"
import { nanoid } from "nanoid"
import { Octokit } from "octokit"

import { cachedFetch } from "./cached-fetch"
import { createDatabase } from "./db"
import type { Bindings } from "./env"
import { computeHash } from "./hash"
import { Project, ProjectToken } from "./project"
import { projectsAllowed, type Role, tokensAllowed } from "./roles-permissions"
import * as schema from "./schema"

export type UiEnv = {
	Bindings: Bindings
	Variables: {
		drizzle: DrizzleD1Database<typeof schema>
		githubUserData: Endpoints[`GET /user`][`response`][`data`]
		userRole: Role
		projectScope: string
	}
}
export const uiRoutes = new Hono<UiEnv>()

const uiAuth: MiddlewareHandler<UiEnv> = async (c, next) => {
	const githubAccessTokenCookie = await getSignedCookie(
		c,
		c.env.COOKIE_SECRET,
		`github-access-token`,
	)

	if (!githubAccessTokenCookie) {
		return c.json({ error: `Unauthorized` }, 401)
	}

	const octokit = new Octokit({
		auth: githubAccessTokenCookie,
	})

	const { data, status } = await octokit.request(`GET /user`, {
		request: { fetch: cachedFetch },
	})

	if (status !== 200) {
		deleteCookie(c, `github-access-token`)
		return c.json({ error: `Unauthorized` }, 401)
	}

	const db = createDatabase(c.env.DB)

	const maybeUser = await db.query.users.findFirst({
		where: eq(schema.users.id, data.id),
		columns: { role: true },
	})

	if (!maybeUser) {
		deleteCookie(c, `github-access-token`)
		return c.json(
			{ error: `User did not move through the expected auth flow.` },
			500,
		)
	}
	const userRole = maybeUser.role

	c.set(`drizzle`, db)
	c.set(`githubUserData`, data)
	c.set(`userRole`, userRole)

	await next()
}

uiRoutes.get(`/project`, uiAuth, async (c) => {
	const db = c.get(`drizzle`)
	const user = c.get(`githubUserData`)
	const projects = await db.query.projects.findMany({
		where: eq(schema.projects.userId, user.id),
		with: {
			tokens: true,
			reports: {
				columns: {
					ref: true,
					jsonSummary: true,
				},
			},
		},
	})
	// console.log(`User`, user)
	// console.log(`Projects`, projects)

	const userRole = c.get(`userRole`)
	const numberOfProjectsAllowed = projectsAllowed.get(userRole)
	const mayCreateProject = projects.length < numberOfProjectsAllowed

	return c.html(
		<>
			{projects.map((project) => (
				<Project
					{...project}
					mode="existing"
					userRole={userRole}
					key={project.id}
				/>
			))}
			<Project mode="button" disabled={!mayCreateProject} />
			{/* <Project mode="creator" />
			<Project
				mode="existing"
				id="123"
				name="my project"
				tokens={[
					{
						id: `123`,
						name: `my token`,
						secretShownOnce: `secret`,
						mode: `existing`,
					},
				]}
				reports={[{ ref: `hahahahhahahahahahahah` }]}
				userRole="free"
			/>
			<Project
				mode="deleted"
				id="123"
				name="my old project"
				tokens={[]}
				reports={[{ ref: `123` }]}
				userRole="free"
			/> */}
		</>,
	)
})

uiRoutes.post(`/project`, uiAuth, async (c) => {
	const userRole = c.get(`userRole`)
	const numberOfProjectsAllowed = projectsAllowed.get(userRole)
	const db = c.get(`drizzle`)
	const { id: userId } = c.get(`githubUserData`)

	const currentProjects = await db.query.projects.findMany({
		where: eq(schema.projects.userId, userId),
	})

	if (currentProjects.length >= numberOfProjectsAllowed) {
		return c.json({ error: `You may not create more projects` }, 401)
	}

	const formData = await c.req.formData()
	const name = type(`string`)(formData.get(`name`))

	if (name instanceof type.errors) {
		console.log(`returning creation form`)
		return c.html(<Project mode="creator" />)
	}
	const project = (
		await db
			.insert(schema.projects)
			.values({ userId, name, id: nanoid() })
			.returning()
	)[0]
	return c.html(
		<Project
			{...project}
			mode="existing"
			userRole={userRole}
			tokens={[]}
			reports={[]}
		/>,
	)
})

uiRoutes.delete(`/project/:projectId`, uiAuth, async (c) => {
	const db = c.get(`drizzle`)
	const projectId = c.req.param(`projectId`)
	const userId = c.get(`githubUserData`).id
	const project = await db.query.projects.findFirst({
		with: {
			tokens: true,
			reports: true,
		},
		where: and(
			eq(schema.projects.id, projectId),
			eq(schema.projects.userId, userId),
		),
	})
	if (!project) {
		return c.json({ error: `No project found` }, 404)
	}

	const result = await db
		.delete(schema.projects)
		.where(
			and(eq(schema.projects.id, projectId), eq(schema.projects.userId, userId)),
		)
	console.log(result)
	return c.html(
		<Project
			{...project}
			userRole={c.get(`userRole`)}
			tokens={project.tokens.map((token) => ({ ...token, mode: `deleted` }))}
			mode="deleted"
		/>,
	)
})

uiRoutes.post(`/token/:projectId`, uiAuth, async (c) => {
	const db = c.get(`drizzle`)
	const userId = c.get(`githubUserData`).id

	const formData = await c.req.formData()
	const name = type(`string`)(formData.get(`name`))
	const projectId = c.req.param(`projectId`)

	const project = await db.query.projects.findFirst({
		where: and(
			eq(schema.projects.id, projectId),
			eq(schema.projects.userId, userId),
		),
		with: {
			tokens: true,
		},
	})

	if (!project) {
		return c.json({ error: `No project found` }, 404)
	}
	const numberOfTokensAllowed = tokensAllowed.get(c.get(`userRole`))
	if (project?.tokens.length >= numberOfTokensAllowed) {
		return c.json({ error: `You may not create more tokens` }, 401)
	}

	if (name instanceof type.errors) {
		console.log(`returning creation form`)
		return c.html(<ProjectToken mode="creator" projectId={projectId} />)
	}
	const id = nanoid()
	const secret = nanoid()
	const salt = nanoid()
	const hash = await computeHash(secret, salt)

	const token = (
		await db
			.insert(schema.tokens)
			.values({
				id,
				name,
				hash,
				salt,
				projectId,
			})
			.returning()
	)[0]
	return c.html(
		<ProjectToken {...token} mode="existing" secretShownOnce={secret} />,
	)
})

uiRoutes.delete(`/token/:tokenId`, uiAuth, async (c) => {
	const db = c.get(`drizzle`)
	const tokenId = c.req.param(`tokenId`)
	const userId = c.get(`githubUserData`).id
	const token = await db.query.tokens.findFirst({
		with: {
			project: {
				with: {
					user: true,
				},
			},
		},
		where: eq(schema.tokens.id, tokenId),
	})
	if (!token) {
		return c.json({ error: `No token found` }, 404)
	}
	if (token.project.user.id !== userId) {
		return c.json({ error: `Not your token` }, 401)
	}

	const result = await db
		.delete(schema.tokens)
		.where(eq(schema.tokens.id, tokenId))
		.run()

	return c.html(<ProjectToken {...token} mode="deleted" />)
})
