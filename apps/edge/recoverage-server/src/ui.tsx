import { type } from "arktype"
import { and, eq } from "drizzle-orm"
import { drizzle } from "drizzle-orm/d1"
import type { MiddlewareHandler } from "hono"
import { Hono } from "hono"
import { deleteCookie, getSignedCookie } from "hono/cookie"
import { nanoid } from "nanoid"
import { Octokit } from "octokit"

import { cachedFetch } from "./cached-fetch"
import type { Env } from "./env"
import { computeHash } from "./hash"
import { Project, ProjectToken } from "./project"
import * as schema from "./schema"

export const uiRoutes = new Hono<Env>()

const uiAuth: MiddlewareHandler<Env> = async (c, next) => {
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
	c.set(
		`drizzle`,
		drizzle(c.env.DB, {
			schema,
			logger: {
				logQuery(query, params) {
					console.info(`📝 query`, query, params)
				},
			},
		}),
	)
	c.set(`githubUserData`, data)

	await next()
}

uiRoutes.get(`/project`, uiAuth, async (c) => {
	const db = c.get(`drizzle`)
	const user = c.get(`githubUserData`)
	const projects = await db.query.projects.findMany({
		where: eq(schema.projects.userId, user.id),
		with: {
			tokens: true,
		},
	})
	console.log(`User`, user)
	console.log(`Projects`, projects)

	return c.html(
		<>
			{projects.map((project) => (
				<Project mode="existing" key={project.id} {...project} />
			))}
			<Project mode="button" />
		</>,
	)
})

uiRoutes.post(`/project`, uiAuth, async (c) => {
	const db = c.get(`drizzle`)
	const { id: userId } = c.get(`githubUserData`)
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
	return c.html(<Project {...project} mode="existing" tokens={[]} />)
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
	return c.html(<Project {...project} mode="deleted" />)
})

uiRoutes.post(`/token/:projectId`, uiAuth, async (c) => {
	const db = c.get(`drizzle`)
	const formData = await c.req.formData()
	const name = type(`string`)(formData.get(`name`))
	const projectId = c.req.param(`projectId`)
	const userId = c.get(`githubUserData`).id

	const project = await db
		.select()
		.from(schema.projects)
		.where(
			and(eq(schema.projects.id, projectId), eq(schema.projects.userId, userId)),
		)
	if (!project) {
		return c.json({ error: `No project found` }, 404)
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
