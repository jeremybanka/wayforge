import { type } from "arktype"
import { and, eq } from "drizzle-orm"
import type { DrizzleD1Database } from "drizzle-orm/d1"
import { drizzle } from "drizzle-orm/d1"
import type { Context, Next } from "hono"
import { Hono } from "hono"
import { deleteCookie, getCookie, setCookie } from "hono/cookie"
import { css } from "hono/css"
import { nanoid } from "nanoid"
import { Octokit } from "octokit"

import { cachedFetch } from "./cached-fetch"
import { Page, SplashPage } from "./page"
import * as Schema from "./schema"

export const GITHUB_CALLBACK_ENDPOINT = `/oauth/github/callback`

type Bindings = {
	DB: D1Database
	GITHUB_CLIENT_ID: string
	GITHUB_CLIENT_SECRET: string
}
type Variables = {
	drizzle: DrizzleD1Database<typeof Schema>
	projectId: number
}
type Env = { Bindings: Bindings; Variables: Variables }

const app = new Hono<Env>()

app.use(`*`, async (c, next) => {
	console.log(c.req.method, c.req.path)
	c.set(`drizzle`, drizzle<typeof Schema>(c.env.DB))
	await next()
})

app.get(`/`, async (c) => {
	const url = new URL(c.req.url)
	const githubAccessTokenCookie = getCookie(c, `github-access-token`)
	if (!githubAccessTokenCookie) {
		return c.html(
			<SplashPage currentUrl={url} githubClientId={c.env.GITHUB_CLIENT_ID} />,
		)
	}

	console.log(`Found github access token cookie`)

	const octokit = new Octokit({
		auth: githubAccessTokenCookie,
	})

	const { data, status } = await octokit.request(`GET /user`, {
		request: { fetch: cachedFetch },
	})

	if (status !== 200) {
		deleteCookie(c, `github-access-token`)
		return c.html(
			<SplashPage currentUrl={url} githubClientId={c.env.GITHUB_CLIENT_ID} />,
		)
	}

	const db = c.get(`drizzle`)
	let user = await db
		.select()
		.from(Schema.users)
		.where(eq(Schema.users.id, data.id))
		.get()
	if (!user) {
		user = (await db.insert(Schema.users).values({ id: data.id }).returning())[0]
	}

	const projects = await db
		.select()
		.from(Schema.projects)
		.where(eq(Schema.projects.userId, user.id))
		.all()

	console.log(`User`, user)
	console.log(`Projects`, projects)

	return c.html(
		<Page>
			<img
				src={data.avatar_url}
				alt={data.login}
				className={css`
              width: 50px;
              position: absolute;
              top: 0;
              left: 20px;
            `}
			/>
			<h1>Recoverage</h1>
			Logged in as {data.login}
			<h2>Your projects</h2>
			<section>
				{projects.map((project) => (
					<div key={project.id}>
						<a href={`/project/${project.id}`}>{project.name}</a>
					</div>
				))}
				<form hx-post="/api/project" hx-swap="beforebegin">
					<input name="userId" type="hidden" value={user.id} />
					<button type="submit" hx-post="/api/project" hx-swap="beforebegin">
						+ New project
					</button>
				</form>
			</section>
		</Page>,
	)
})

app.post(`/api/project`, async (c) => {
	const db = c.get(`drizzle`)
	const formData = await c.req.formData()
	const name = type(`string`)(formData.get(`name`))
	const userId = Number(type(`string`)(formData.get(`userId`)))

	if (name instanceof type.errors) {
		console.log(`returning creation form`)
		return c.html(
			<form hx-post="/api/project" hx-swap="outerHTML">
				<input name="userId" type="hidden" value={userId} />
				<label>
					Project name:
					<input type="text" name="name" />
				</label>
				<button type="submit">Submit</button>
			</form>,
		)
	}
	const project = (
		await db
			.insert(Schema.projects)
			.values({ userId, name, id: nanoid() })
			.returning()
	)[0]
	return c.html(
		<div>
			<a href={`/project/${project.id}`}>{project.name}</a>
		</div>,
	)
})

app.get(GITHUB_CALLBACK_ENDPOINT, async (c) => {
	const code = c.req.query(`code`)
	if (!code) {
		return c.json({ error: `No code provided` }, 400)
	}
	const accessTokenUrl = new URL(`https://github.com/login/oauth/access_token`)
	accessTokenUrl.searchParams.set(`client_id`, c.env.GITHUB_CLIENT_ID)
	accessTokenUrl.searchParams.set(`client_secret`, c.env.GITHUB_CLIENT_SECRET)
	accessTokenUrl.searchParams.set(`code`, code)

	const accessTokenResponse = await fetch(accessTokenUrl)

	if (!accessTokenResponse.ok) {
		return c.json({ error: `Failed to get access token` }, 400)
	}
	const responseText = await accessTokenResponse.text()

	console.log(responseText)

	const params = new URLSearchParams(responseText)
	const accessToken = params.get(`access_token`)
	if (!accessToken) {
		return c.json({ error: `Failed to get access token` }, 400)
	}
	setCookie(c, `github-access-token`, accessToken, {
		httpOnly: true,
		path: `/`,
	})

	return c.redirect(`/`)
})

// Helper to compute SHA-256 hash
async function computeHash(verifier: string) {
	const hashBuffer = await crypto.subtle.digest(
		`SHA-256`,
		new TextEncoder().encode(verifier),
	)
	return Array.from(new Uint8Array(hashBuffer))
		.map((b) => b.toString(16).padStart(2, `0`))
		.join(``)
}

// API Authentication Middleware
const apiAuth = async (c: Context<Env>, next: Next) => {
	const authHeader = c.req.header(`Authorization`)
	if (!authHeader?.startsWith(`Bearer `)) {
		return c.json({ error: `Unauthorized` }, 401)
	}
	const token = authHeader.slice(7) // Remove "Bearer "
	const [selector, verifier] = token.split(`.`)
	if (!selector || !verifier) {
		return c.json({ error: `Invalid token format` }, 401)
	}
	const db = c.get(`drizzle`)
	const tokenRecord = await db
		.select()
		.from(Schema.tokens)
		.where(eq(Schema.tokens.selector, selector))
		.get() // Use .get() for single row in Drizzle with D1
	if (!tokenRecord) {
		return c.json({ error: `Token not found` }, 401)
	}
	const hash = await computeHash(verifier)
	if (hash !== tokenRecord.verifierHash) {
		return c.json({ error: `Invalid token` }, 401)
	}
	c.set(`projectId`, tokenRecord.projectId)
	await next()
}

// GET /api/report: Retrieve the default report
app.get(`/api/report/:projectId`, apiAuth, async (c) => {
	const projectId = c.req.param(`projectId`)
	const userId = c.get(`projectId`)
	const db = c.get(`drizzle`)
	const project = await db
		.select()
		.from(Schema.projects)
		.where(
			and(eq(Schema.projects.userId, userId), eq(Schema.projects.id, projectId)),
		)
		.get()
	if (!project) {
		return c.json({ error: `No project found` }, 404)
	}
	const report = await db
		.select()
		.from(Schema.reports)
		.where(eq(Schema.reports.projectId, projectId))
		.get()
	if (!report) {
		return c.json({ error: `No default report found` }, 404)
	}
	const data = JSON.parse(report.data)
	return c.json(data)
})

// PUT /api/report: Upload or update the default report
app.put(`/api/report`, apiAuth, async (c) => {
	const userId = c.get(`projectId`)
	const data = await c.req.json()
	const jsonData = JSON.stringify(data)
	const db = c.get(`drizzle`)
	// const existingReport = await db
	// 	.select()
	// 	.from(Schema.reports)
	// 	.where(eq(Schema.reports.userId, userId))
	// 	.all()
	// if (existingReport) {
	// 	await db
	// 		.update(Schema.reports)
	// 		.set({ data: jsonData })
	// 		.where(eq(Schema.reports.id, existingReport.id))
	// 		.run()
	// } else {
	// 	const id = crypto.randomUUID()
	// 	await db.insert(Schema.reports).values({ id, userId, data: jsonData }).run()
	// }
	return c.json({ success: true })
})

export default app
