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
	for (const tool of [`go`, `bun`, `node`, `carapace`]) {
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
	run(`bun`, [`build`, fixture, `--compile`, `--outfile=${directory}/cli`])
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
})

afterAll(() => {
	if (directory) rmSync(directory, { recursive: true, force: true })
})

for (const kind of [`node`, `compiled`]) {
	for (const command of [`__complete`, `__completeNoDesc`]) {
		test.each([
			[`enum`, [`--state`, `cl`]],
			[`inline value`, [`--state=cl`]],
			[`descriptions`, [`--base`, `ma`]],
			[`no space`, [`--token`, `pref`]],
			[`files`, [`--input`, ``]],
			[`directories`, [`--directory`, ``]],
		] satisfies [string, string[]][])(
			`${kind} ${command}: %s matches upstream`,
			(_name, words) => {
				const args = [command, `pr`, `list`, ...words]
				const actual =
					kind === `node`
						? run(`node`, [path.join(directory, `cli.js`), ...args])
						: run(path.join(directory, `cli`), args)
				expect(actual).toBe(
					run(path.join(directory, `cobra-oracle`), [command, ...words]),
				)
			},
		)
	}
}

test(`Carapace's Cobra bridge drops inline values for both implementations`, () => {
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
})
