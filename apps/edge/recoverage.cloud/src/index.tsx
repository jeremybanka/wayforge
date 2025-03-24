import { eq } from "drizzle-orm"
import { Hono } from "hono"
import { deleteCookie, getSignedCookie, setSignedCookie } from "hono/cookie"
import { css } from "hono/css"
import { Octokit } from "octokit"

import { assetsRoutes } from "./assets"
import { cachedFetch } from "./cached-fetch"
import { createDatabase } from "./db"
import { GITHUB_CALLBACK_ENDPOINT } from "./env"
import { Page, SplashPage } from "./page"
import { reporterRoutes } from "./reporter"
import * as schema from "./schema"
import { shieldsRoutes } from "./shields"
import type { UiEnv } from "./ui"
import { uiRoutes } from "./ui"

const app = new Hono<UiEnv>()

app.use(`*`, async (c, next) => {
	console.log(c.req.method, c.req.path)
	await next()
})

app.route(`assets`, assetsRoutes)
app.route(`reporter`, reporterRoutes)
app.route(`ui`, uiRoutes)
app.route(`shields`, shieldsRoutes)

app.get(`/`, async (c) => {
	const url = new URL(c.req.url)
	const githubAccessTokenCookie = await getSignedCookie(
		c,
		c.env.COOKIE_SECRET,
		`github-access-token`,
	)
	if (!githubAccessTokenCookie) {
		return c.html(
			<SplashPage currentUrl={url} githubClientId={c.env.GITHUB_CLIENT_ID} />,
		)
	}

	console.log(`Found github access token cookie`)

	try {
		const octokit = new Octokit({ auth: githubAccessTokenCookie })

		const { data } = await octokit.request(`GET /user`, {
			request: { fetch: cachedFetch },
		})

		const db = createDatabase(c.env.DB)

		c.set(`drizzle`, db)
		let user = await db
			.select()
			.from(schema.users)
			.where(eq(schema.users.id, data.id))
			.get()
		user ??= (
			await db.insert(schema.users).values({ id: data.id }).returning()
		)[0]

		return await c.html(
			<Page>
				<img
					src={data.avatar_url}
					alt={data.login}
					class={css`
					width: 50px;
					position: absolute;
					top: 0;
					left: 20px;
				`}
				/>
				<h1>Recoverage</h1>
				<p>
					Logged in as {data.login} ({data.id})
				</p>
				<h2>Your Projects</h2>
				<div
					hx-get="/ui/project"
					hx-trigger="load"
					class={css`
					display: flex;
					flex-flow: column;
					gap: 10px;
				`}
				/>
			</Page>,
		)
	} catch (error) {
		deleteCookie(c, `github-access-token`)
		return c.html(
			<SplashPage currentUrl={url} githubClientId={c.env.GITHUB_CLIENT_ID} />,
		)
	}
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

	const accessTokenResponse = await cachedFetch(accessTokenUrl)

	if (!accessTokenResponse.ok) {
		return c.json({ error: `Failed to get access token` }, 400)
	}
	const accessTokenResponseText = await accessTokenResponse.text()

	console.log({ accessTokenResponseText })

	const params = new URLSearchParams(accessTokenResponseText)
	const accessToken = params.get(`access_token`)
	if (!accessToken) {
		return c.json({ error: `Failed to get access token` }, 400)
	}
	await setSignedCookie(
		c,
		`github-access-token`,
		accessToken,
		c.env.COOKIE_SECRET,
		{
			sameSite: `strict`,
			httpOnly: true,
			path: `/`,
		},
	)

	return c.redirect(`/`)
})

export default app
