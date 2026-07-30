import { describe, expect, it } from "bun:test"
import fs from "node:fs/promises"
import os from "node:os"
import path from "node:path"
import {
	assertProbeLockfile,
	probeLatestPackageRemediation,
	remediationProbeRoot,
	type AuditIssue,
} from "./vigilance-bot.bun.ts"

const issue: AuditIssue = {
	affectedTopPackages: new Set([`example`]),
	auditPaths: new Set([`example>fast-uri`]),
	id: `GHSA-example`,
	packageName: `fast-uri`,
	severity: `high`,
	title: null,
	url: null,
	vulnerableVersions: new Set([`3.1.2`]),
}

describe(`Vigilance remediation probes`, () => {
	it(`uses a sibling directory outside the published-package testbed`, () => {
		const testbedPath = path.join(`/tmp`, `wayforge-vigilance-testbed`)

		expect(remediationProbeRoot(testbedPath)).toBe(
			path.join(`/tmp`, `wayforge-vigilance-testbed-remediation-probes`),
		)
	})

	it(`turns probe failures into cached unavailable diagnostics`, async () => {
		let attempts = 0
		const probeCache = new Map()
		const input = {
			issue,
			packageManager: `pnpm@11.18.0`,
			packageName: `fast-uri`,
			probeCache,
			probeRoot: `/tmp/probes`,
			runProbe: () => {
				attempts += 1
				return Promise.reject(new Error(`generated lockfile was missing`))
			},
		}

		const [first, second] = await Promise.all([
			probeLatestPackageRemediation(input),
			probeLatestPackageRemediation(input),
		])

		expect(first).toEqual({
			affectedVersions: [],
			error: `generated lockfile was missing`,
			latestVersion: null,
			packageName: `fast-uri`,
			safe: null,
		})
		expect(second).toEqual(first)
		expect(attempts).toBe(1)
	})

	it(`includes install output when a successful install creates no lockfile`, async () => {
		const probePath = await fs.mkdtemp(
			path.join(os.tmpdir(), `vigilance-probe-test-`),
		)

		try {
			let error: unknown
			try {
				await assertProbeLockfile(probePath, {
					exitCode: 0,
					stderr: `pnpm warning`,
					stdout: `Done`,
					timedOut: false,
				})
			} catch (caughtError) {
				error = caughtError
			}

			expect(error).toBeInstanceOf(Error)
			expect((error as Error).message).toBe(
				`pnpm install completed without creating ${path.join(probePath, `pnpm-lock.yaml`)}.\nDone\npnpm warning`,
			)
		} finally {
			await fs.rm(probePath, { force: true, recursive: true })
		}
	})
})
