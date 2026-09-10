import { execFileSync } from "node:child_process"
import {
	existsSync,
	mkdirSync,
	mkdtempSync,
	readFileSync,
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
	for (const tool of [
		`bash`,
		`zsh`,
		`fish`,
		`nu`,
		`carapace`,
		`bun`,
		`node`,
		`go`,
	])
		run(tool, tool === `go` ? [`version`] : [`--version`])
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
	writeFileSync(
		path.join(directory, `config/carapace/specs/upstream-cobra.yaml`),
		`name: upstream-cobra\nparsing: disabled\ncompletion:\n  positionalany: ['$carapace.bridge.Cobra(["${directory}/cobra-oracle"])']\n`,
	)

	run(
		`go`,
		[`build`, `-o`, path.join(directory, `cobra-oracle`), `.`],
		environment,
		path.join(import.meta.dirname, `../scripts/completions`),
	)
})

afterAll(() => {
	if (directory && !process.env[`COMLINE_KEEP_FIXTURES`])
		rmSync(directory, { recursive: true, force: true })
})

for (const kind of [`global`, `compiled`]) {
	describe(kind, () => {
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
			// Test that limitation against upstream separately below.
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

		test(`Carapace's Cobra bridge has the same inline-value limitation with upstream Cobra`, () => {
			const actualWire = run(
				`comline-fixture`,
				[`__complete`, `pr`, `list`, `--state=cl`],
				mode(kind),
			)
			const upstreamWire = run(path.join(directory, `cobra-oracle`), [
				`__complete`,
				`--state=cl`,
			])
			expect(actualWire).toBe(upstreamWire)
			const actualBridge = JSON.parse(
				run(
					`carapace`,
					[
						`cobra-fixture`,
						`nushell`,
						`comline-fixture`,
						`pr`,
						`list`,
						`--state=cl`,
					],
					mode(kind),
				),
			)
			const upstreamBridge = JSON.parse(
				run(
					`carapace`,
					[`upstream-cobra`, `nushell`, `upstream-cobra`, `--state=cl`],
					mode(kind),
				),
			)
			expect(actualBridge).toEqual(upstreamBridge)
			expect(actualBridge).toEqual([])
		})

		test(`Cobra emits the same wire format as upstream`, () => {
			const actual = run(
				`comline-fixture`,
				[`__complete`, `pr`, `list`, `--state`, `cl`],
				mode(kind),
			)
			const expected = run(path.join(directory, `cobra-oracle`), [
				`oracle`,
				`__completeNoDesc`,
				`cl`,
			])
			expect(actual).toBe(expected)
		})
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

test(`vendored adapters match the pinned Cobra generator`, () => {
	const generated = run(path.join(directory, `cobra-oracle`), [])
	expect(generated).toBe(
		readFileSync(
			path.join(import.meta.dirname, `../src/completion-scripts.gen.ts`),
			`utf8`,
		),
	)
})

test(`the compiled completion endpoint needs no runtime on PATH`, () => {
	expect(
		run(
			path.join(directory, `compiled/comline-fixture`),
			[`__complete`, `pr`, `list`, `--state`, `cl`],
			{ ...environment, PATH: directory },
		),
	).toBe(`closed\n:4\n`)
})
