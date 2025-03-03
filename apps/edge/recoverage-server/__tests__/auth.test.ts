import { env } from "cloudflare:test"
import { afterEach, expect, it, vi } from "vitest"

import app from "../src"
import { GITHUB_CALLBACK_ENDPOINT } from "../src/env"

afterEach(() => {
	vi.restoreAllMocks()
})

it(`mocks GET requests`, async () => {
	vi.spyOn(globalThis, `fetch`).mockImplementation(async (input, init) => {
		await Promise.resolve()
		const request = new Request(input, init)
		const url = new URL(request.url)

		// console.log(request.method)
		// console.log(url.origin)
		// console.log(url.pathname)

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
})
