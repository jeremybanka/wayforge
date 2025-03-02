import { env } from "cloudflare:test"

import app from "../src/app"

console.log(env)

describe(`Example`, () => {
	it(`Should return 401 response`, async () => {
		const res = await app.request(
			`/api/report/12345`,
			{
				method: `GET`,
				headers: {
					Authorization: `Bearer selector.verifierHash`,
				},
			},
			env,
		)

		const { status } = res
		const json = await res.json()
		console.log({ status, json })
		expect(status).toBe(401)
		expect(await json).toEqual({
			error: `Token not found`,
		})
	})
})
