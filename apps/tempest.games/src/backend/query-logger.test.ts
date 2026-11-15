import { readFileSync } from "node:fs"

import { describe, expect, it, vi } from "vitest"

import { createQueryLogger } from "./query-logger"

describe(`query logging`, () => {
	it(`retains diagnostics but never emits bound authentication values`, () => {
		const info = vi.fn()
		const logger = createQueryLogger({ info })
		const secrets = [`otp-canary`, `session-canary`, `password-hash-canary`]
		for (const table of [`account_actions`, `user_sessions`, `users`]) {
			logger.logQuery(`insert into "${table}" values ($1, $2, $3)`, secrets)
		}
		expect(info).toHaveBeenCalledTimes(3)
		for (const call of info.mock.calls) {
			expect(call[1]).toMatchObject({
				operation: `insert`,
				parameterCount: 3,
				parameters: `[REDACTED]`,
			})
		}
		for (const secret of secrets) {
			expect(JSON.stringify(info.mock.calls)).not.toContain(secret)
		}
	})

	it(`redacts literals, comments, identifiers, and nested parameter values`, () => {
		const info = vi.fn()
		const logger = createQueryLogger({ info })
		const secret = `raw-secret-canary`
		for (const query of [
			`select '${secret}'`,
			`select $$${secret}$$`,
			`select 123456 /* ${secret} */`,
			`select "${secret}"`,
			`${secret}`,
		]) {
			logger.logQuery(query, [{ nested: [secret] }])
		}
		expect(JSON.stringify(info.mock.calls)).not.toContain(secret)
		expect(JSON.stringify(info.mock.calls)).not.toContain(`123456`)
	})

	it(`correlates statements without inspecting or mutating parameters`, () => {
		const info = vi.fn()
		const logger = createQueryLogger({ info })
		const params = Object.freeze([
			{
				toJSON: () => {
					throw new Error(`secret`)
				},
			},
		])
		logger.logQuery(`select $1`, params as unknown as unknown[])
		logger.logQuery(`select $1`, [`different`])
		logger.logQuery(`select $2`, [])
		expect(info.mock.calls[0][1].queryId).toBe(info.mock.calls[1][1].queryId)
		expect(info.mock.calls[0][1].queryId).not.toBe(info.mock.calls[2][1].queryId)
		createQueryLogger({ info }).logQuery(`select $1`, [])
		expect(info.mock.calls[0][1].queryId).not.toBe(info.mock.calls[3][1].queryId)
	})

	it(`keeps account-action issuance and verification logs value-free`, () => {
		const source = readFileSync(
			new URL(`./trpc-app-router.ts`, import.meta.url),
			`utf8`,
		)
		expect(source).toContain(
			`ctx.logger.info(\`🔑 verifying account action token\`)`,
		)
		expect(source).toContain(
			`ctx.logger.info(\`🔑 account action code generated\`)`,
		)
		expect(source).not.toMatch(
			/logger\.\w+\([^\n]*(?:oneTimeCode|accountActionCode)/,
		)
	})
})
