import { env } from "cloudflare:test"

import app from "../src"

console.log(env)

describe(`Example`, () => {
	it(`Should return 200 response`, async () => {
		const res = await app.request(
			`/api/report`,
			{
				method: `GET`,
				headers: {
					Authorization: `Bearer selector.verifierHash`,
				},
			},
			env,
		)

		console.log(res)
		console.log(await res.json())
		expect(res.status).toBe(200)
		expect(await res.json()).toEqual({
			hello: `world`,
			var: `my variable`,
		})
	})
})
