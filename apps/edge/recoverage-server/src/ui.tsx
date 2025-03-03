import { type } from "arktype"
import { and, eq } from "drizzle-orm"
import type { MiddlewareHandler } from "hono"
import { Hono } from "hono"
import { deleteCookie, getCookie } from "hono/cookie"
import { css } from "hono/css"
import { nanoid } from "nanoid"
import { Octokit } from "octokit"

import { cachedFetch } from "./cached-fetch"
import type { Env } from "./env"
import { Project } from "./project"
import * as schema from "./schema"

export const uiRoutes = new Hono<Env>()

const uiAuth: MiddlewareHandler<Env> = async (c, next) => {
	const githubAccessTokenCookie = getCookie(c, `github-access-token`)

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
	c.set(`githubUserData`, data)

	await next()
}

uiRoutes.post(`/project`, uiAuth, async (c) => {
	const db = c.get(`drizzle`)
	const formData = await c.req.formData()
	const name = type(`string`)(formData.get(`name`))
	const userId = c.get(`githubUserData`).id

	if (name instanceof type.errors) {
		console.log(`returning creation form`)
		return c.html(
			<form
				hx-post="/ui/project"
				hx-swap="outerHTML"
				class={css`
					display: flex;
					flex-flow: column;
					gap: 10px;
				`}
			>
				<input type="text" name="name" />
				<button type="submit">Submit</button>
			</form>,
		)
	}
	const project = (
		await db
			.insert(schema.projects)
			.values({ userId, name, id: nanoid() })
			.returning()
	)[0]
	return c.html(<Project {...project} tokens={[]} />)
})

uiRoutes.delete(`/project/:projectId`, uiAuth, async (c) => {
	const db = c.get(`drizzle`)
	const projectId = c.req.param(`projectId`)
	const userId = c.get(`githubUserData`).id
	const result = await db
		.delete(schema.projects)
		.where(
			and(eq(schema.projects.id, projectId), eq(schema.projects.userId, userId)),
		)
	console.log(result)
	return c.html(
		<Project id={projectId} name="deleted" tokens={[]} deleted={true} />,
	)
})
