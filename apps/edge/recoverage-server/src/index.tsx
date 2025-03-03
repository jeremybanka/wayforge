import { eq } from "drizzle-orm"
import { drizzle } from "drizzle-orm/d1"
import { Hono } from "hono"
import { deleteCookie, getSignedCookie, setSignedCookie } from "hono/cookie"
import { css } from "hono/css"
import { Octokit } from "octokit"

import { assetsRoutes } from "./assets"
import { cachedFetch } from "./cached-fetch"
import { type Env, GITHUB_CALLBACK_ENDPOINT } from "./env"
import { Page, SplashPage } from "./page"
import { reporterRoutes } from "./reporter"
import * as schema from "./schema"
import { uiRoutes } from "./ui"

const app = new Hono<Env>()

app.use(`*`, async (c, next) => {
	console.log(c.req.method, c.req.path)
	await next()
})

app.route(`assets`, assetsRoutes)
app.route(`reporter`, reporterRoutes)
app.route(`ui`, uiRoutes)

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

	const db = drizzle(c.env.DB, {
		schema,
		logger: {
			logQuery(query, params) {
				console.info(`📝 query`, query, params)
			},
		},
	})

	c.set(`drizzle`, db)
	let user = await db
		.select()
		.from(schema.users)
		.where(eq(schema.users.id, data.id))
		.get()
	if (!user) {
		user = (await db.insert(schema.users).values({ id: data.id }).returning())[0]
	}

	return c.html(
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
			Logged in as {data.login}
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
			httpOnly: true,
			path: `/`,
		},
	)

	const signedCookie = await getSignedCookie(
		c,
		c.env.COOKIE_SECRET,
		`github-access-token`,
	)
	console.log({ signedCookie })

	return c.redirect(`/`)
})

export default app
