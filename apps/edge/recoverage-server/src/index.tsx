import { eq } from "drizzle-orm"
import { drizzle } from "drizzle-orm/d1"
import { Hono } from "hono"
import { deleteCookie, getCookie, setCookie } from "hono/cookie"
import { css } from "hono/css"
import { Octokit } from "octokit"

import { cachedFetch } from "./cached-fetch"
import type { Env } from "./env"
import { Page, SplashPage } from "./page"
import { Project } from "./project"
import reporterRoutes from "./reporter"
import * as Schema from "./schema"
import uiRoutes from "./ui"

export const GITHUB_CALLBACK_ENDPOINT = `/oauth/github/callback`

const app = new Hono<Env>()

app.use(`*`, async (c, next) => {
	console.log(c.req.method, c.req.path)
	c.set(`drizzle`, drizzle<typeof Schema>(c.env.DB))
	await next()
})

app.route(`reporter`, reporterRoutes)
app.route(`ui`, uiRoutes)

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
			<section
				className={css`
					display: flex;
					flex-flow: column;
					gap: 10px;
				`}
			>
				{projects.map((project) => (
					<Project key={project.id} id={project.id} name={project.name} />
				))}
				<form hx-post="/ui/project" hx-swap="beforebegin">
					<input name="userId" type="hidden" value={user.id} />
					<button type="submit">+ New project</button>
				</form>
			</section>
		</Page>,
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

export default app
