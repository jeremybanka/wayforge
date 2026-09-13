import { spawnSync } from "node:child_process"
import {
	existsSync,
	mkdirSync,
	mkdtempSync,
	readdirSync,
	rmSync,
	writeFileSync,
} from "node:fs"
import { tmpdir } from "node:os"
import { resolve } from "node:path"

import { afterEach, beforeEach, describe, expect, it } from "bun:test"

let directory: string
beforeEach(() => {
	directory = mkdtempSync(resolve(tmpdir(), `break-check-cli-`))
})
afterEach(() => {
	rmSync(directory, { recursive: true, force: true })
})

function runCli(command: string, args: string[]) {
	const result = spawnSync(
		`node`,
		[resolve(import.meta.dirname, `../bin/${command}.bin.js`), ...args],
		{
			cwd: directory,
			encoding: `utf8`,
			timeout: 10000,
			env: { ...process.env, NO_COLOR: `1`, XDG_CACHE_HOME: directory },
		},
	)
	expect(result.error).toBeUndefined()
	expect(result.status, result.stderr).toBe(0)
	return result
}

describe(`CLI features`, () => {
	it(`generates all shell integrations without validating configuration`, () => {
		writeFileSync(resolve(directory, `break-check.config.json`), `invalid json`)
		for (const target of [`bash`, `zsh`, `fish`, `nushell`, `carapace`]) {
			const result = runCli(`break-check`, [`completion`, target])
			expect(result.stdout).toContain(`break-check`)
			expect(result.stderr).toBe(``)
		}
		expect(readdirSync(directory)).toEqual([`break-check.config.json`])
	})
	it.each([
		`--test-command`,
		`--pattern`,
		`--tag-pattern`,
		`--certify-command`,
		`--base-dir`,
	])(`offers %s before validating required options`, (option) => {
		const result = runCli(`break-check`, [`__complete`, option])
		expect(result.stdout).toContain(option)
		expect(result.stderr).toBe(``)
	})
	it(`completes config files and directory values`, () => {
		mkdirSync(resolve(directory, `sample-dir`))
		writeFileSync(resolve(directory, `sample.json`), `{}`)
		expect(
			runCli(`break-check`, [`_carapace`, `export`, `break-check`, `sam`])
				.stdout,
		).toContain(`sample.json`)
		for (const words of [[`--base-dir=sam`], [`schema`, `--out-dir=sam`]]) {
			const result = runCli(`break-check`, [
				`_carapace`,
				`export`,
				`break-check`,
				...words,
			])
			expect(result.stdout).toContain(`sample-dir/`)
			expect(result.stdout).not.toContain(`sample.json`)
		}
	})
	it(`accepts the output alias and warns about ignored options before schema generation`, () => {
		const result = runCli(`break-check`, [
			`schema`,
			`--out-dir=${directory}`,
			`--test-command=true`,
			`--typo`,
		])
		expect(existsSync(resolve(directory, `break-check.main.schema.json`))).toBe(
			true,
		)
		expect(result.stderr).toContain(`Option "--test-command" is not valid`)
		expect(result.stderr).toContain(`Unknown option "--typo"`)
		expect(result.stderr).not.toContain(`--out-dir`)
		expect(result.stdout).not.toContain(`Warning:`)
	})
})
