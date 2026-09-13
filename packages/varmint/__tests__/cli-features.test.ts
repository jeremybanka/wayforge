import { spawnSync } from "node:child_process"
import { mkdtempSync, readdirSync, rmSync, writeFileSync } from "node:fs"
import { tmpdir } from "node:os"
import { resolve } from "node:path"

import { afterEach, beforeEach, describe, expect, it } from "vitest"

let directory: string
beforeEach(() => {
	directory = mkdtempSync(resolve(tmpdir(), `varmint-cli-`))
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
	it(`generates all shell integrations without loading configuration or initializing tracking`, () => {
		writeFileSync(resolve(directory, `varmint.config.json`), `invalid json`)
		for (const target of [`bash`, `zsh`, `fish`, `nushell`, `carapace`]) {
			const result = runCli(`varmint`, [`completion`, target])
			expect(result.stdout).toContain(`varmint`)
			expect(result.stderr).toBe(``)
		}
		expect(readdirSync(directory)).toEqual([`varmint.config.json`])
	})
	it(`completes commands and CI names without workspace actions`, () => {
		const commands = runCli(`varmint`, [`__complete`, ``])
		expect(commands.stdout).toContain(`track`)
		expect(commands.stdout).toContain(`clean`)
		expect(
			runCli(`varmint`, [`__complete`, `clean`, `--ci-flag=C`]).stdout,
		).toContain(`CI`)
		expect(
			runCli(`varmint`, [`__complete`, `clean`, `--ci-flag=CI`, `--ci-`]).stdout,
		).not.toContain(`--ci-flag`)
		expect(commands.stderr).toBe(``)
		expect(readdirSync(directory)).toEqual([])
	})
	it(`warns on ignored options without mixing warnings into help output`, () => {
		const result = runCli(`varmint`, [`--help`, `--ci-flag=CI`, `--typo`])
		expect(result.stderr).toContain(`Option "--ci-flag" is not valid`)
		expect(result.stderr).toContain(`Unknown option "--typo"`)
		expect(result.stdout).toContain(`USAGE`)
		expect(result.stdout).not.toContain(`Warning:`)
	})
})
