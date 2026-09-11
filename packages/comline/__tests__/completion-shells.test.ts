import { execFileSync } from "node:child_process"
import {
	chmodSync,
	existsSync,
	mkdirSync,
	mkdtempSync,
	rmSync,
	writeFileSync,
} from "node:fs"
import { tmpdir } from "node:os"
import path from "node:path"

import {
	completionScript,
	updateCompletionSetup,
} from "../src/completion-transport"

let directory: string
let environment: NodeJS.ProcessEnv
let counter = 0

function run(
	executable: string,
	args: string[],
	env = environment,
	cwd = directory,
): string {
	return execFileSync(executable, args, {
		cwd,
		env,
		encoding: `utf8`,
		timeout: 60_000,
		stdio: [`ignore`, `pipe`, `pipe`],
	})
}
function mode(kind: string): NodeJS.ProcessEnv {
	return {
		...environment,
		PATH:
			path.join(directory, kind === `compiled` ? `compiled` : `global/bin`) +
			path.delimiter +
			environment[`PATH`],
	}
}

beforeAll(() => {
	directory = mkdtempSync(path.join(tmpdir(), `comline-completions-`))
	environment = {
		...process.env,
		BASH_COMPLETION_USER_FILE: `/dev/null`,
		XDG_CONFIG_HOME: path.join(directory, `config`),
		XDG_CACHE_HOME: path.join(directory, `cache`),
		ZDOTDIR: path.join(directory, `zsh-config`),
		npm_config_cache: path.join(directory, `npm-cache`),
	}
	// Missing tools are failures: this suite must exercise every real consumer.
	for (const tool of [`bash`, `zsh`, `fish`, `nu`, `carapace`, `bun`, `node`])
		run(tool, [`--version`])
	const fixture = path.join(directory, `package`)
	mkdirSync(fixture)
	mkdirSync(path.join(directory, `config/carapace/specs`), { recursive: true })
	mkdirSync(path.join(directory, `zsh-config`))
	mkdirSync(path.join(directory, `folder with spaces`))
	writeFileSync(path.join(directory, `file with spaces.txt`), ``)
	run(`bun`, [
		`build`,
		path.join(import.meta.dirname, `fixtures/completion.x.ts`),
		`--target=node`,
		`--outfile=${fixture}/cli.js`,
	])
	run(`bun`, [
		`build`,
		path.join(import.meta.dirname, `fixtures/completion.x.ts`),
		`--compile`,
		`--outfile=${directory}/compiled/comline-fixture`,
	])
	writeFileSync(
		path.join(fixture, `package.json`),
		JSON.stringify({
			name: `comline-shell-fixture`,
			version: `1.0.0`,
			type: `module`,
			bin: { "comline-fixture": `cli.js` },
		}),
	)
	run(`npm`, [
		`install`,
		`--global`,
		`--prefix`,
		path.join(directory, `global`),
		fixture,
		`--offline`,
		`--ignore-scripts`,
		`--no-audit`,
		`--no-fund`,
	])
	for (const shell of [`bash`, `zsh`, `fish`, `nushell`] as const) {
		writeFileSync(
			path.join(directory, shell),
			completionScript(`comline-fixture`, shell),
		)
	}
	writeFileSync(
		path.join(directory, `config/carapace/specs/comline-fixture.yaml`),
		completionScript(`comline-fixture`, `carapace`),
	)
	// A second registration exercises Carapace's independent Cobra protocol reader.
	writeFileSync(
		path.join(directory, `config/carapace/specs/cobra-fixture.yaml`),
		`name: cobra-fixture\nparsing: disabled\ncompletion:\n  positionalany: ["$carapace.bridge.Cobra([comline-fixture])"]\n`,
	)
	for (const bridge of [`carapace`, `cobra`]) {
		writeFileSync(
			path.join(directory, `nu-${bridge}`),
			`$env.config.completions.external.enable = true\n$env.config.completions.external.completer = {|spans| carapace ${bridge === `cobra` ? `cobra-fixture` : `comline-fixture`} nushell ...$spans | from json }\n`,
		)
	}
}, 120_000)

afterAll(() => {
	if (directory && !process.env[`COMLINE_KEEP_FIXTURES`])
		rmSync(directory, { recursive: true, force: true })
})

for (const kind of [`global`, `compiled`]) {
	describe(kind, { timeout: 30_000 }, () => {
		for (const shell of [
			`bash`,
			`zsh`,
			`fish`,
			`nu`,
			`nu-carapace`,
			`nu-cobra`,
		]) {
			const cases: [
				string,
				string,
				{ case?: string; opts: Record<string, string> },
			][] = [
				[`route`, `comline-fixture pr li\t`, { case: `pr/list`, opts: {} }],
				[
					`enum`,
					`comline-fixture pr list --state cl\t`,
					{ opts: { state: `closed` } },
				],
				[
					`inline`,
					`comline-fixture pr list --state=cl\t`,
					{ opts: { state: `closed` } },
				],
				[
					`spaces`,
					`comline-fixture pr list --base feat\t`,
					{ opts: { base: `feature branch` } },
				],
				[
					`files`,
					`comline-fixture pr list --input file\t`,
					{ opts: { input: `file with spaces.txt` } },
				],
				[
					`option names`,
					`comline-fixture pr list --sta\tcl\t`,
					{ opts: { state: `closed` } },
				],
				[
					`trailing space`,
					`comline-fixture \tli\t`,
					{ case: `pr/list`, opts: {} },
				],
				[
					`quoted input`,
					`comline-fixture pr list --base "feat"\t`,
					{ opts: { base: `feature branch` } },
				],
				[
					`apostrophe`,
					`comline-fixture pr list --base quo\t`,
					{ opts: { base: `quote'branch` } },
				],
				[
					`double quote`,
					`comline-fixture pr list --base dou\t`,
					{ opts: { base: `double"branch` } },
				],
				[
					`literal shell syntax`,
					`comline-fixture pr list --base doll\t`,
					{ opts: { base: `dollar$(touch injected)` } },
				],
				[
					`no space`,
					`comline-fixture pr list --token pref\tsuffix`,
					{ opts: { token: `prefix/suffix` } },
				],
				[
					`no space without punctuation`,
					`comline-fixture pr list --token pla\tsuffix`,
					{ opts: { token: `plainsuffix` } },
				],
				[
					`quoted earlier argument`,
					`comline-fixture pr list --base "feature branch" --state cl\t`,
					{ opts: { base: `feature branch`, state: `closed` } },
				],
				[
					`empty earlier argument`,
					`comline-fixture pr list --base "" --state cl\t`,
					{ opts: { base: ``, state: `closed` } },
				],
				[
					`literal shell syntax in an earlier completion`,
					`comline-fixture pr list --base doll\t --state cl\t`,
					{ opts: { base: `dollar$(touch injected)`, state: `closed` } },
				],
				[
					`directories`,
					`comline-fixture pr list --directory fold\tchild`,
					{ opts: { directory: `folder with spaces/child` } },
				],
				[
					`delimiter`,
					`comline-fixture -- pr li\t`,
					{ case: `pr/list`, opts: {} },
				],
				[
					`cursor in earlier word`,
					`comline-fixture pr list --state cl --base main${`\x1b[D`.repeat(12)}\t`,
					{ opts: { state: `closed`, base: `main` } },
				],
			]
			// Carapace's Cobra bridge drops inline values even for upstream Cobra.
			// The separate Cobra suite verifies that limitation against upstream.
			test.each(
				cases.filter(([name]) => shell !== `nu-cobra` || name !== `inline`),
			)(
				`${shell} inserts $0 through its real line editor`,
				(_name, line, expected) => {
					const output = path.join(directory, `output-${counter++}.json`)
					const result = run(
						`bun`,
						[
							path.join(import.meta.dirname, `fixtures/shell-completion.bun.ts`),
							shell.startsWith(`nu`) ? `nu` : shell,
							path.join(directory, shell === `nu` ? `nushell` : shell),
							output,
							line,
						],
						mode(kind),
					)
					expect(JSON.parse(result)).toMatchObject(expected)
					expect(existsSync(path.join(directory, `injected`))).toBe(false)
				},
			)
		}
		test.each([`comline-fixture`, `cobra-fixture`])(
			`Carapace reads %s and renders Nushell candidates`,
			(name) => {
				const result = JSON.parse(
					run(
						`carapace`,
						[name, `nushell`, name, `pr`, `list`, `--base`, `ma`],
						mode(kind),
					),
				)
				expect(result.map((item: { value: string }) => item.value)).toEqual([
					`main `,
					`maintenance `,
				])
				expect(result[0].description).toBe(`Main branch`)
			},
		)
		test(`Zsh discovers the adapter through fpath`, () => {
			const fpath = path.join(directory, `autoload-${kind}`)
			mkdirSync(fpath)
			writeFileSync(
				path.join(fpath, `_comline-fixture`),
				completionScript(`comline-fixture`, `zsh`),
			)
			const setup = path.join(directory, `autoload-${kind}.zsh`)
			writeFileSync(
				setup,
				`fpath=(${JSON.stringify(fpath)} $fpath)\ncompinit -i -D\n`,
			)
			const result = run(
				`bun`,
				[
					path.join(import.meta.dirname, `fixtures/shell-completion.bun.ts`),
					`zsh`,
					setup,
					path.join(directory, `output-${counter++}.json`),
					`comline-fixture pr li\t`,
				],
				mode(kind),
			)
			expect(JSON.parse(result).case).toBe(`pr/list`)
		})
		test(`Zsh ignores unrelated insecure completion directories without prompting`, () => {
			const insecure = path.join(directory, `insecure-zsh-${kind}`)
			mkdirSync(insecure)
			chmodSync(insecure, 0o777)
			const fpath = run(`zsh`, [`-f`, `-c`, `print -r -- $FPATH`]).trim()
			const result = run(
				`bun`,
				[
					path.join(import.meta.dirname, `fixtures/shell-completion.bun.ts`),
					`zsh`,
					path.join(directory, `zsh`),
					path.join(directory, `output-${counter++}.json`),
					`comline-fixture pr li\t`,
				],
				{ ...mode(kind), FPATH: `${insecure}:${fpath}` },
			)
			expect(JSON.parse(result).case).toBe(`pr/list`)
		})
		test.each([`bash`, `zsh`, `fish`, `nushell`] as const)(
			`%s setup still executes after reindentation and update`,
			(shell) => {
				const script = completionScript(`comline-fixture`, shell)
				const formatted = script
					.split(`\n`)
					.map((line) => `    ${line}`)
					.join(`\n`)
				const updated = updateCompletionSetup(
					formatted,
					`comline-fixture`,
					shell,
				)
				const setup = path.join(directory, `formatted-${shell}`)
				writeFileSync(setup, updated)
				const output = path.join(directory, `output-${counter++}.json`)
				const result = run(
					`bun`,
					[
						path.join(import.meta.dirname, `fixtures/shell-completion.bun.ts`),
						shell === `nushell` ? `nu` : shell,
						setup,
						output,
						`comline-fixture pr li\t`,
					],
					mode(kind),
				)
				expect(JSON.parse(result).case).toBe(`pr/list`)
			},
		)

		test.each([`bash`, `zsh`, `fish`, `nushell`, `carapace`] as const)(
			`the executable ships its %s integration`,
			(target) => {
				expect(run(`comline-fixture`, [`completion`, target], mode(kind))).toBe(
					completionScript(`comline-fixture`, target),
				)
			},
		)
		test(`Nushell registration preserves the existing external completer`, () => {
			const script = `$env.config.completions.external.completer = {|spans| [{value: "fallback"}] }
source ${JSON.stringify(path.join(directory, `nushell`))}
let completer = $env.config.completions.external.completer
do $completer [another-command ""] | to json`
			expect(
				JSON.parse(run(`nu`, [`--no-config-file`, `-c`, script], mode(kind))),
			).toEqual([{ value: `fallback` }])
		})
	})
}

test(`the compiled completion endpoint needs no runtime on PATH`, () => {
	expect(
		run(
			path.join(directory, `compiled/comline-fixture`),
			[`__complete`, `pr`, `list`, `--state`, `cl`],
			{ ...environment, PATH: directory },
		),
	).toBe(`closed\n:4\n`)
})
