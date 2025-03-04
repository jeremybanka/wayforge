import { env } from "cloudflare:test"
import { XMLParser } from "fast-xml-parser"
import { afterEach, expect, it, vi } from "vitest"

import app from "../src"
import { GITHUB_CALLBACK_ENDPOINT } from "../src/env"
import { reportFixture } from "./report-fixture"

afterEach(() => {
	vi.restoreAllMocks()
})

it(`mocks GET requests`, async () => {
	vi.spyOn(globalThis, `fetch`).mockImplementation(async (input, init) => {
		await Promise.resolve()
		const request = new Request(input, init)
		const url = new URL(request.url)

		console.log(`[intercepted]`, request.method, url.origin + url.pathname)

		switch (`${request.method} ${url.origin}${url.pathname}`) {
			case `GET https://github.com/login/oauth/authorize`: {
				const redirectUrl = new URL(GITHUB_CALLBACK_ENDPOINT, `http://localhost`)
				redirectUrl.searchParams.set(`code`, `mocked-github-token`)
				return app.request(
					redirectUrl.pathname + redirectUrl.search,
					{ method: `GET` },
					env,
				)
			}
			case `GET https://github.com/login/oauth/access_token`:
				return new Response(`access_token=gho_fake&scope=user&token_type=bearer`)
			case `GET https://api.github.com/user`:
				return Response.json({
					id: 12345,
					login: `testuser`,
					email: `testuser@example.com`,
				})

			default:
				throw new Error(`No mock found`)
		}
	})

	const response = await app.request(`/`, { method: `GET` }, env)
	expect(response.status).toBe(200)

	const authRes = await fetch(`https://github.com/login/oauth/authorize`)
	const githubAccessTokenCookie = authRes.headers.get(`set-cookie`)

	assert(githubAccessTokenCookie)

	const response2 = await app.request(
		`/`,
		{
			method: `GET`,
			headers: {
				Cookie: githubAccessTokenCookie,
			},
		},
		env,
	)
	expect(response2.status).toBe(200)

	const project = await app.request(
		`/ui/project`,
		{
			method: `POST`,
			headers: {
				Cookie: githubAccessTokenCookie,
				"Content-Type": `application/x-www-form-urlencoded`,
			},
			body: `name=test`,
		},
		env,
	)
	const projectText = await project.text()

	const hxPost = projectText.match(/hx-post="([^"]+)"/)
	const postTokenToProjectUrl = hxPost?.[1]
	assert(postTokenToProjectUrl)
	console.log({ postTokenToProjectUrl })
	const projectId = postTokenToProjectUrl.split(`/`)[3]

	console.log({ projectId })

	const token = await app.request(
		postTokenToProjectUrl,
		{
			method: `POST`,
			headers: {
				Cookie: githubAccessTokenCookie,
				"Content-Type": `application/x-www-form-urlencoded`,
			},
			body: `name=test`,
		},
		env,
	)

	const tokenText = await token.text()
	const parser = new XMLParser()
	const tokenXml = parser.parse(tokenText)
	const code = tokenXml.div.div[0].span.code
	console.log({ code })
	assert(code)

	const reportMissing = await app.request(
		`/reporter/${projectId}`,
		{
			method: `GET`,
			headers: {
				Authorization: `Bearer ${code}`,
			},
		},
		env,
	)
	console.log(await reportMissing.json())
	expect(reportMissing.status).toBe(404)

	const reportPut = await app.request(
		`/reporter/${projectId}`,
		{
			method: `PUT`,
			headers: {
				Authorization: `Bearer ${code}`,
			},
			body: JSON.stringify(reportFixture),
		},
		env,
	)

	console.log(await reportPut.json())
	expect(reportPut.status).toBe(200)

	const reportGet = await app.request(
		`/reporter/${projectId}`,
		{
			method: `GET`,
			headers: {
				Authorization: `Bearer ${code}`,
			},
		},
		env,
	)

	expect(reportGet.status).toBe(200)
	expect(await reportGet.json()).toEqual(reportFixture)
})
