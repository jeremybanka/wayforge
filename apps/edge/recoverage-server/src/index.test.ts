// src/index.test.ts
import { env } from "cloudflare:test"

import app from "./index"

describe(`Example`, () => {
	it(`Should return 200 response`, async () => {
		const res = await app.request(`/hello`, {}, env)

		expect(res.status).toBe(200)
		expect(await res.json()).toEqual({
			hello: `world`,
			var: `my variable`,
		})
	})
})
