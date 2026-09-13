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

function runCli(args: string[]) {
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

describe(`break-check help`, () => {
	it.each(
		[[`--help`], [`-h`], [`--help=true`], [`--help`, `true`]].map((args) => ({
			args,
		})),
	)(`prints help without configuration: %j`, ({ args }) => {
		const result = runCli(args)
		expect(result.exitCode).toBe(0)
		expect(result.stdout).toContain(`USAGE`)
		expect(result.stderr).toBe(``)
		expect(readdirSync(tempDir)).toEqual([])
	})

	it.each([[], [`broken.json`]].map((args) => ({ args })))(
		`skips malformed configuration when help is requested: %j`,
		({ args }) => {
			writeFileSync(
				path.join(tempDir, args[0] ?? `break-check.config.json`),
				`{ invalid json`,
			)
			const result = runCli([...args, `--help`])
			expect(result.exitCode).toBe(0)
			expect(result.stdout).toContain(`USAGE`)
			expect(result.stderr).toBe(``)
		},
	)

	it.each(
		[
			[`schema`, `--help`],
			[`-h`, `schema`],
		].map((args) => ({ args })),
	)(`prints schema help without writing files: %j`, ({ args }) => {
		const result = runCli(args)
		expect(result.exitCode).toBe(0)
		expect(result.stdout).toContain(`USAGE`)
		expect(result.stdout).not.toContain(`Wrote`)
		expect(result.stderr).toBe(``)
		expect(readdirSync(tempDir)).toEqual([])
	})

	it(`exits before checks when configuration enables help`, () => {
		writeFileSync(
			path.join(tempDir, `break-check.config.json`),
			JSON.stringify({
				testPattern: `*__public.test.ts`,
				testCommand: `exit 99`,
				certifyCommand: `exit 99`,
				help: true,
			}),
		)
		const result = runCli([])
		expect(result.exitCode).toBe(0)
		expect(result.stdout).toContain(`USAGE`)
		expect(result.stdout).not.toContain(`Break check failed`)
		expect(result.stderr).toBe(``)
	})

	it.each(
		[
			[],
			[`--help=false`],
			[`-h`, `0`],
			[`--testCommand=--help`],
			[`--`, `--help`],
		].map((args) => ({ args })),
	)(`still requires check configuration for non-help input: %j`, ({ args }) => {
		const result = runCli(args)
		expect(result.exitCode).not.toBe(0)
		expect(result.stdout).not.toContain(`USAGE`)
		expect(result.stderr).toContain(`required arguments were not provided`)
	})
})
