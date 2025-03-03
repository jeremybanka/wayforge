import { eq } from "drizzle-orm"
import { drizzle } from "drizzle-orm/d1"
import { Hono } from "hono"
import { deleteCookie, getCookie, setCookie } from "hono/cookie"
import { css } from "hono/css"
import { Octokit } from "octokit"

import { assetsRoutes } from "./assets"
import { cachedFetch } from "./cached-fetch"
import { type Env, GITHUB_CALLBACK_ENDPOINT } from "./env"
import { Page, SplashPage } from "./page"
import { Project } from "./project"
import { reporterRoutes } from "./reporter"
import * as schema from "./schema"
import { uiRoutes } from "./ui"

const app = new Hono<Env>()

app.use(`*`, async (c, next) => {
	console.log(c.req.method, c.req.path)
	c.set(`drizzle`, drizzle(c.env.DB, { schema }))
	await next()
})

app.route(`assets`, assetsRoutes)
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
		.from(schema.users)
		.where(eq(schema.users.id, data.id))
		.get()
	if (!user) {
		user = (await db.insert(schema.users).values({ id: data.id }).returning())[0]
	}

	console.log(db)

	const projects = await db.query.projects.findMany({
		where: eq(schema.projects.userId, user.id),
		with: {
			tokens: true,
		},
	})

	console.log(`User`, user)
	console.log(`Projects`, projects)

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
			<section
				class={css`
					display: flex;
					flex-flow: column;
					gap: 10px;
				`}
			>
				{projects.map((project) => (
					<Project key={project.id} {...project} />
				))}
				<form hx-post="/ui/project" hx-swap="beforebegin">
					<button
						class={css`
							background-color: #fff;
							box-shadow: 0 3px 0 -2px #0003;
							border: 1px solid black;
							padding: 10px;
						`}
						type="submit"
					>
						+ New project
					</button>
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
