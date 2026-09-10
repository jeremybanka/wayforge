import { execFileSync } from "node:child_process"
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs"
import { tmpdir } from "node:os"
import path from "node:path"

let directory: string
let project: string
let env: NodeJS.ProcessEnv

function run(executable: string, args: readonly string[]): string {
	return execFileSync(executable, args, {
		cwd: project,
		env,
		encoding: `utf8`,
		stdio: [`ignore`, `pipe`, `pipe`],
		timeout: 30_000,
	})
}

beforeAll(() => {
	directory = mkdtempSync(path.join(tmpdir(), `comline-launchers-`))
	project = path.join(directory, `project`)
	const fixture = path.join(directory, `package`)
	const global = path.join(directory, `global`)
	mkdirSync(project)
	mkdirSync(fixture)
	env = {
		...process.env,
		PATH: `${path.join(global, `bin`)}${path.delimiter}${process.env[`PATH`]}`,
		npm_config_cache: path.join(directory, `npm-cache`),
		MISE_CONFIG_DIR: path.join(directory, `mise-config`),
		MISE_CACHE_DIR: path.join(directory, `mise-cache`),
		MISE_TRUSTED_CONFIG_PATHS: directory,
	}
	// Use installed tool versions; the fixture never downloads a runtime.
	writeFileSync(
		path.join(project, `mise.toml`),
		`[tools]\nnode = "${run(`node`, [`--version`]).trim().replace(/^v/, ``)}"\npnpm = "${run(`pnpm`, [`--version`]).trim()}"\n`,
	)
	writeFileSync(
		path.join(project, `package.json`),
		JSON.stringify({ private: true }),
	)
	writeFileSync(
		path.join(fixture, `package.json`),
		JSON.stringify({
			name: `comline-launcher-fixture`,
			version: `1.0.0`,
			type: `module`,
			bin: { mycli: `mycli.mjs` },
		}),
	)
	run(`bun`, [
		`build`,
		path.join(import.meta.dirname, `fixtures/argv.x.ts`),
		`--target=node`,
		`--outfile=${path.join(fixture, `mycli.mjs`)}`,
	])
	const install = [
		`--offline`,
		`--ignore-scripts`,
		`--no-audit`,
		`--no-fund`,
		`--package-lock=false`,
	]
	run(`npm`, [`install`, `--global`, `--prefix`, global, fixture, ...install])
	run(`npm`, [`install`, `--save-dev`, fixture, ...install])
}, 60_000)

afterAll(() => {
	if (directory) rmSync(directory, { recursive: true, force: true })
})

const launchers = [
	{ command: [`mycli`], positionalOnly: false },
	{ command: [`bun`, `mycli`], positionalOnly: false },
	{ command: [`pnpm`, `exec`, `mycli`], positionalOnly: false },
	{ command: [`node`, `node_modules/.bin/mycli`, `--`], positionalOnly: true },
	{
		command: [`mise`, `exec`, `--`, `pnpm`, `exec`, `mycli`, `--`],
		positionalOnly: true,
	},
	{
		command: [`mise`, `exec`, `--`, `node`, `./node_modules/.bin/mycli`],
		positionalOnly: false,
	},
	// Also exercise Bun itself rather than its shebang-aware command runner.
	{ command: [`bun`, `--bun`, `mycli`], positionalOnly: false },
]

test.each(launchers)(
	`parses full process.argv through $command`,
	({ command, positionalOnly }) => {
		const [executable, ...args] = command
		const result = JSON.parse(run(executable, [...args, `foo`]))
		expect(result.argv.slice(2)).toEqual(
			positionalOnly ? [`--`, `foo`] : [`foo`],
		)
		expect(result.inputs).toEqual({ case: `foo`, path: [`foo`], opts: {} })
	},
)

test.each(launchers)(
	`preserves the delimiter delivered through $command`,
	({ command, positionalOnly }) => {
		const [executable, ...args] = command
		const result = JSON.parse(run(executable, [...args, `foo`, `--name=main`]))
		expect(result.inputs).toEqual(
			positionalOnly
				? { case: `foo/$value`, path: [`foo`, `--name=main`], opts: {} }
				: { case: `foo`, path: [`foo`], opts: { name: `main` } },
		)
	},
)
