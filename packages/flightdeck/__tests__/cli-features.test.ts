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

import { afterEach, beforeEach, describe, expect, it } from "vitest"

let directory: string
beforeEach(() => {
	directory = mkdtempSync(resolve(tmpdir(), `flightdeck-cli-`))
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

describe(`CLI completions`, () => {
	it.each([`flightdeck`, `klaxon`])(
		`generates shell integrations for %s without reading application config`,
		(command) => {
			writeFileSync(resolve(directory, `${command}.config.json`), `invalid json`)
			for (const target of [`bash`, `zsh`, `fish`, `nushell`, `carapace`]) {
				const result = runCli(command, [`completion`, target])
				expect(result.stdout).toContain(command)
				expect(result.stderr).toBe(``)
			}
			expect(readdirSync(directory)).toEqual([`${command}.config.json`])
		},
	)
	it(`completes FlightDeck commands and aliases with clean protocol output`, () => {
		writeFileSync(resolve(directory, `flightdeck.config.json`), `invalid json`)
		const result = runCli(`flightdeck`, [`__complete`, `k`])
		expect(result.stdout).toContain(`kill\t`)
		expect(result.stdout).toMatch(/:\d+\n$/)
		expect(result.stdout).not.toContain(`timestamp`)
		expect(result.stderr).toBe(``)
		expect(runCli(`flightdeck`, [`__complete`, `--package-n`]).stdout).toContain(
			`--package-name`,
		)
		expect(
			runCli(`flightdeck`, [`__complete`, `--package-name=demo`, `--package-`])
				.stdout,
		).not.toContain(`--package-name`)
		expect(
			runCli(`flightdeck`, [`__complete`, `--json-logging=f`]).stdout,
		).toContain(`false`)
	})
	it.each([[], [`kill`]])(`completes config files after %j`, (...prefix) => {
		writeFileSync(resolve(directory, `sample.json`), `{}`)
		expect(
			runCli(`flightdeck`, [
				`_carapace`,
				`export`,
				`flightdeck`,
				...prefix,
				`sam`,
			]).stdout,
		).toContain(`sample.json`)
	})
	it.each([[], [`kill`], [`schema`]])(
		`restricts directory values after %j`,
		(...prefix) => {
			mkdirSync(resolve(directory, `sample-dir`))
			writeFileSync(resolve(directory, `sample-file`), ``)
			const option =
				prefix[0] === `schema` ? `--out-dir=sam` : `--flightdeck-root-dir=sam`
			const result = runCli(`flightdeck`, [
				`_carapace`,
				`export`,
				`flightdeck`,
				...prefix,
				option,
			])
			expect(result.stdout).toContain(`sample-dir/`)
			expect(result.stdout).not.toContain(`sample-file`)
		},
	)
	it(`flushes large completion responses before exiting`, () => {
		for (let index = 0; index < 1200; index++)
			writeFileSync(
				resolve(directory, `sample-${index.toString().padStart(4, `0`)}.json`),
				``,
			)
		const result = runCli(`flightdeck`, [
			`_carapace`,
			`export`,
			`flightdeck`,
			`sam`,
		])
		const response = JSON.parse(result.stdout)
		expect(response.values).toHaveLength(1200)
		expect(Buffer.byteLength(result.stdout)).toBeGreaterThan(65536)
	})
	it(`completes Klaxon options without parsing JSON or sending notifications`, () => {
		const result = runCli(`klaxon`, [
			`__complete`,
			`scramble`,
			`--package-config=invalid`,
			`--published-p`,
		])
		expect(result.stdout).toContain(`--published-packages`)
		expect(result.stderr).toBe(``)
	})
})

describe(`CLI aliases and warnings`, () => {
	it(`writes FlightDeck schemas using an alias and keeps ignored-option warnings on stderr`, () => {
		const result = runCli(`flightdeck`, [
			`schema`,
			`--out-dir=${directory}`,
			`--port=1234`,
			`--typo`,
		])
		expect(existsSync(resolve(directory, `flightdeck.main.schema.json`))).toBe(
			true,
		)
		expect(result.stderr).toContain(`Option "--port" is not valid`)
		expect(result.stderr).toContain(`Unknown option "--typo"`)
		expect(result.stderr).not.toContain(`--out-dir`)
		expect(result.stdout).not.toContain(`Warning:`)
	})
	it.each([
		[`--package-config={}`, `--secrets-config={}`, `--published-packages=[]`],
		[`--packageConfig={}`, `--secretsConfig={}`, `--publishedPackages=[]`],
	])(`accepts Klaxon option spellings %j`, (...args) => {
		const result = runCli(`klaxon`, [`scramble`, ...args, `--typo`])
		expect(result.stdout.trim()).toBe(`{}`)
		expect(result.stderr).toContain(`Unknown option "--typo"`)
		expect(result.stderr.trim().split(`\n`)).toHaveLength(1)
	})
})
