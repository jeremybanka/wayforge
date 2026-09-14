import { mkdtempSync, readdirSync, rmSync, writeFileSync } from "node:fs"
import { tmpdir } from "node:os"
import path from "node:path"

import { afterEach, beforeEach, describe, expect, it } from "bun:test"

const entrypoint = path.resolve(import.meta.dir, `../src/break-check.x.ts`)
let tempDir: string

beforeEach(() => {
	tempDir = mkdtempSync(path.join(tmpdir(), `break-check-help-`))
})

afterEach(() => {
	rmSync(tempDir, { recursive: true, force: true })
})

function runCli(args: readonly string[]) {
	const result = Bun.spawnSync([process.execPath, entrypoint, `--`, ...args], {
		cwd: tempDir,
		env: { ...process.env, NO_COLOR: `1` },
	})
	return {
		exitCode: result.exitCode,
		stdout: result.stdout.toString(),
		stderr: result.stderr.toString(),
	}
}

describe(`break-check help route`, () => {
	it(`prints usage without check options or filesystem actions`, () => {
		const result = runCli([`help`])
		expect(result.exitCode).toBe(0)
		expect(result.stdout).toContain(`USAGE`)
		expect(result.stdout).toContain(`help`)
		expect(result.stdout).toContain(`schema`)
		expect(result.stdout).toContain(`--testCommand`)
		expect(result.stdout).not.toContain(`--help`)
		expect(result.stderr).toBe(``)
		expect(readdirSync(tempDir)).toEqual([])
	})

	it(`skips malformed default configuration and a file named help`, () => {
		writeFileSync(path.join(tempDir, `break-check.config.json`), `{ invalid`)
		writeFileSync(path.join(tempDir, `help`), `{ invalid`)
		const result = runCli([`help`])
		expect(result.exitCode).toBe(0)
		expect(result.stdout).toContain(`USAGE`)
		expect(result.stderr).toBe(``)
		expect(readdirSync(tempDir).sort()).toEqual([
			`break-check.config.json`,
			`help`,
		])
	})

	it(`preserves schema generation without reading default configuration`, () => {
		writeFileSync(path.join(tempDir, `break-check.config.json`), `{ invalid`)
		const result = runCli([`schema`])
		expect(result.exitCode).toBe(0)
		expect(result.stdout).toContain(`Wrote json.schema`)
		expect(result.stdout).not.toContain(`USAGE`)
		expect(result.stderr).toBe(``)
		expect(readdirSync(tempDir)).toContain(`break-check.main.schema.json`)
	})

	it.each([
		{ args: [], config: `break-check.config.json` },
		{ args: [`check.json`], config: `check.json` },
		{ args: [`./help`], config: `help` },
	])(`keeps $args on the check path`, ({ args, config }) => {
		writeFileSync(
			path.join(tempDir, config),
			JSON.stringify({
				testPattern: `*__public.test.ts`,
				testCommand: `exit 99`,
				certifyCommand: `exit 99`,
			}),
		)
		// A valid configuration reaches the check's non-repository outcome.
		const result = runCli(args)
		expect(result.exitCode).toBe(2)
		expect(result.stdout).toContain(`Break check failed to determine`)
		expect(result.stdout).not.toContain(`USAGE`)
		expect(result.stderr).toBe(``)
	})

	it.each(
		[[], [`--help`], [`-h`], [`--testCommand=help`]].map((args) => ({ args })),
	)(`requires check configuration outside the help route: %j`, ({ args }) => {
		const result = runCli(args)
		expect(result.exitCode).not.toBe(0)
		expect(result.stdout).not.toContain(`USAGE`)
		expect(result.stderr).toContain(`required arguments were not provided`)
	})
})
