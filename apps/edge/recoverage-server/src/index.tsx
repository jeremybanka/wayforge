// const app = new Hono()
// app.use(renderer)
// app.get(`/`, (c) => {
// 	return c.render(<h1>Hello!</h1>)
// })
// export default app
import { type } from "arktype"
import { and, eq } from "drizzle-orm"
import type { DrizzleD1Database } from "drizzle-orm/d1"
import { drizzle } from "drizzle-orm/d1"
import type { Context, Next } from "hono"
import { Hono } from "hono"
import { getCookie, setCookie } from "hono/cookie"
import { css, Style } from "hono/css"

import { Html } from "./html"
import { renderer } from "./renderer"
import * as Schema from "./schema"

type Bindings = {
	DB: D1Database
	GITHUB_CLIENT_ID: string
	GITHUB_CLIENT_SECRET: string
}
type Variables = {
	renderer: typeof renderer
	drizzle: DrizzleD1Database<typeof Schema>
	userId: number
}
type Env = { Bindings: Bindings; Variables: Variables }

const app = new Hono<Env>()

app.use(renderer)
app.use(`*`, async (c, next) => {
	c.set(`drizzle`, drizzle<typeof Schema>(c.env.DB))
	await next()
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
	c.set(`userId`, tokenRecord.userId)
	await next()
}

app.get(`/`, (c) => {
	console.log(c.req.url)
	const url = new URL(c.req.url)

	const githubAccessTokenCookie = getCookie(c, `github-access-token`)
	if (githubAccessTokenCookie) {
		console.log(`Found github access token cookie`)
	}

	return c.html(
		<Html>
			<main
				className={css`
						border: 1px solid black;
						padding: 20px;
						flex-grow: 0;
						display: flex;
						flex-direction: column;
						max-width: 630px;
						width: 100%;
						margin: auto;
						min-height: 500px;
					`}
			>
				<h1>Recoverage</h1>
				<p>A microplatform for storing your coverage reports.</p>
				<div className={css`flex-grow: 1;`} />
				<a
					href={`https://github.com/login/oauth/authorize?client_id=${c.env.GITHUB_CLIENT_ID}&redirect_uri=http://${url.host}/oauth/github/callback&scope=user`}
				>
					Login with GitHub
				</a>
			</main>
		</Html>,
	)
})

// GET /api/report: Retrieve the default report
app.get(`/api/report/:projectId`, apiAuth, async (c) => {
	const projectId = c.req.param(`projectId`)
	const userId = c.get(`userId`)
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
	const userId = c.get(`userId`)
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

app.get(`/oauth/github/callback`, async (c) => {
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

export default app
