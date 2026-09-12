import { execFileSync } from "node:child_process"
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs"
import { tmpdir } from "node:os"
import path from "node:path"

let directory: string
let environment: NodeJS.ProcessEnv

function run(command: string, args: string[], cwd = directory): string {
	return execFileSync(command, args, {
		cwd,
		env: environment,
		encoding: `utf8`,
		timeout: 60_000,
		stdio: [`ignore`, `pipe`, `pipe`],
	})
}

beforeAll(() => {
	directory = mkdtempSync(path.join(tmpdir(), `comline-cobra-`))
	environment = {
		...process.env,
		XDG_CONFIG_HOME: path.join(directory, `config`),
		XDG_CACHE_HOME: path.join(directory, `cache`),
	}
	for (const tool of [`go`, `bun`, `node`]) {
		run(tool, tool === `go` ? [`version`] : [`--version`])
	}
	run(
		`go`,
		[`build`, `-o`, path.join(directory, `cobra-oracle`), `.`],
		path.join(import.meta.dirname, `fixtures/cobra`),
	)
	const fixture = path.join(import.meta.dirname, `fixtures/completion.x.ts`)
	run(`bun`, [
		`build`,
		fixture,
		`--target=node`,
		`--outfile=${directory}/cli.js`,
	])
}, 120_000)

afterAll(() => {
	if (directory) rmSync(directory, { recursive: true, force: true })
})

for (const command of [`__complete`, `__completeNoDesc`]) {
	test.each([
		[`enum`, [`--state`, `cl`]],
		[`inline value`, [`--state=cl`]],
		[`descriptions`, [`--base`, `ma`]],
		[`no space`, [`--token`, `pref`]],
		[`files`, [`--input`, ``]],
		[`directories`, [`--directory`, ``]],
	] satisfies [string, string[]][])(
		`${command}: %s matches upstream`,
		(_name, words) => {
			const actual = run(`node`, [
				path.join(directory, `cli.js`),
				command,
				`pr`,
				`list`,
				...words,
			])
			expect(actual).toBe(
				run(path.join(directory, `cobra-oracle`), [command, ...words]),
			)
		},
		30_000,
	)
}

// Opt in when investigating consumer upgrades; an upstream limitation is not a
// required behavior of comline. Normal protocol tests above require no Carapace.
test.runIf(process.env[`COMLINE_PROBE_CARAPACE_COBRA`] === `1`)(
	`Carapace's Cobra bridge drops inline values for both implementations`,
	() => {
		run(`bun`, [
			`build`,
			path.join(import.meta.dirname, `fixtures/completion.x.ts`),
			`--compile`,
			`--outfile=${directory}/cli`,
		])
		const specs = path.join(directory, `config/carapace/specs`)
		mkdirSync(specs, { recursive: true })
		for (const [name, executable] of [
			[`upstream`, `cobra-oracle`],
			[`comline`, `cli`],
		]) {
			writeFileSync(
				path.join(specs, `${name}.yaml`),
				`name: ${name}\nparsing: disabled\ncompletion:\n  positionalany: ['$carapace.bridge.Cobra(["${path.join(directory, executable)}"])']\n`,
			)
		}
		const upstream = JSON.parse(
			run(`carapace`, [`upstream`, `nushell`, `upstream`, `--state=cl`]),
		)
		const actual = JSON.parse(
			run(`carapace`, [
				`comline`,
				`nushell`,
				`comline`,
				`pr`,
				`list`,
				`--state=cl`,
			]),
		)
		expect(actual).toEqual(upstream)
		expect(actual).toEqual([])
	},
	30_000,
)
