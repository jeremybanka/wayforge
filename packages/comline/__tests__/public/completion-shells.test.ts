import {
	chmodSync,
	existsSync,
	mkdirSync,
	readFileSync,
	rmSync,
	symlinkSync,
	writeFileSync,
} from "node:fs"
import path from "node:path"

import {
	completionScript,
	installCompletion,
} from "../../src/completion-transport"
import {
	completeInstalledValue,
	completionTargets,
	directory,
	environment,
	interactiveShells,
	mode,
	prepareCustomXdgPaths,
	prepareLoginCompletionPaths,
	run,
	runLineEditor,
	withProfile,
} from "../fixtures/completion-shells"
import { inputValues } from "../fixtures/contract-values"

describe(`global`, { timeout: 30_000 }, () => {
	for (const shell of interactiveShells) {
		const cases: [
			string,
			string,
			{ case?: string; path?: string[]; opts: Record<string, string> },
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
				`comline-fixture pr list -- \t`,
				{ case: `pr/list/$value`, opts: {} },
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
			[`delimiter`, `comline-fixture -- pr li\t`, { case: `pr/list`, opts: {} }],
			[
				`cursor in earlier word`,
				`comline-fixture pr list --state cl --base main${`\x1b[D`.repeat(12)}\t`,
				{ opts: { state: `closed`, base: `main` } },
			],
		]
		if ([`bash`, `zsh`, `fish`].includes(shell)) {
			cases.push([
				`empty candidate`,
				`comline-fixture pr list --empty \tTAIL`,
				{ path: [`pr`, `list`, `TAIL`], opts: { empty: `` } },
			])
		}
		if (shell === `nu`) {
			cases.push(
				[
					`literal star provider`,
					`comline-fixture pr list --base sta\t`,
					{ opts: { base: `star*branch` } },
				],
				[
					`literal question provider`,
					`comline-fixture pr list --base ques\t`,
					{ opts: { base: `question?branch` } },
				],
				[
					`literal star filesystem`,
					`comline-fixture pr list --input globstar*\t`,
					{ opts: { input: `globstar*file` } },
				],
				[
					`literal question filesystem`,
					`comline-fixture pr list --input globquestion?\t`,
					{ opts: { input: `globquestion?file` } },
				],
			)
		}
		if (shell === `zsh` || shell === `bash`) {
			cases.push([
				`equals signs within inline values`,
				`comline-fixture pr list --base=key=va\t`,
				{ opts: { base: `key=value` } },
			])
		}
		if (shell === `bash`) {
			cases.push(
				[
					`equals signs within separate values`,
					`comline-fixture pr list --base key=va\t`,
					{ opts: { base: `key=value` } },
				],
				[
					`quoted equals signs`,
					`comline-fixture pr list --base "key=va"\t`,
					{ opts: { base: `key=value` } },
				],
				[
					`escaped equals signs`,
					`comline-fixture pr list --base key\\=va\t`,
					{ opts: { base: `key=value` } },
				],
			)
		}
		if (shell === `bash`) {
			cases.push(
				[
					`inline file paths`,
					`comline-fixture pr list --input=file\t`,
					{ opts: { input: `file with spaces.txt` } },
				],
				[
					`quoted inline directory paths`,
					`comline-fixture pr list "--directory=fold"\tchild`,
					{ opts: { directory: `folder with spaces/child` } },
				],
				[
					`quoted inline file directory continuation`,
					`comline-fixture pr list "--input=fold"\tchild`,
					{ opts: { input: `folder with spaces/child` } },
				],
				[
					`inline directory paths`,
					`comline-fixture pr list --directory=fold\tchild`,
					{ opts: { directory: `folder with spaces/child` } },
				],
				[
					`inline file paths containing equals signs`,
					`comline-fixture pr list --input=key=fi\t`,
					{ opts: { input: `key=file.txt` } },
				],
			)
		}
		if (shell === `zsh` || shell === `bash`) {
			cases.push([
				`quoted executable`,
				// bash-completion cannot autoload a quoted command name; first load
				// it with an ordinary completion, then clear the line and quote it.
				`${shell === `bash` ? `comline-fixture pr li\t\x15` : ``}"comline-fixture" pr li\t`,
				{ case: `pr/list`, opts: {} },
			])
		}
		if (shell === `bash` || shell === `zsh`) {
			cases.push([
				`candidate spacing override`,
				`comline-fixture pr list --token spa\t--base main`,
				{ opts: { token: `spaced`, base: `main` } },
			])
		}
		if ([`bash`, `zsh`, `fish`].includes(shell)) {
			cases.push(
				[
					`positional assignment after delimiter`,
					`comline-fixture pr list -- --key=val\t`,
					{ path: [`pr`, `list`, `--key=value`], opts: {} },
				],
				[
					`dash-prefixed separate value`,
					`comline-fixture pr list --base --key=val\t`,
					{ opts: { base: `--key=value` } },
				],
				[
					`dash-prefixed inline value`,
					`comline-fixture pr list --base=--key=val\t`,
					{ opts: { base: `--key=value` } },
				],
			)
		}
		// Carapace's Cobra bridge drops inline values even for upstream Cobra.
		// The optional Cobra compatibility probe reproduces that upstream limitation.
		test.each(
			cases.filter(
				([name]) =>
					(shell !== `nu-cobra` || name !== `inline`) &&
					// Fish exposes no arbitrary no-space flag; assert its native behavior below.
					(shell !== `fish` || name !== `no space without punctuation`),
			),
		)(
			`${shell} inserts $0 through its real line editor`,
			(_name, line, expected) => {
				const result = runLineEditor(shell, line, `global`)
				expect(JSON.parse(result)).toMatchObject(expected)
				expect(existsSync(path.join(directory, `injected`))).toBe(false)
			},
		)
	}

	test(`Nushell distinguishes discovered home paths from literal provider values`, () => {
		for (const [line, expected] of [
			[
				`comline-fixture pr list --input ~/home-o\t`,
				{ input: path.join(directory, `home/home-only.txt`) },
			],
			[
				`comline-fixture pr list --base ~/literal\t`,
				{ base: `~/literal-branch` },
			],
		] as const) {
			const result = runLineEditor(`nu`, line, `global`)
			expect(JSON.parse(result).opts).toEqual(expected)
		}
	})

	test.each([
		{ prefix: `caf`, value: `café`, locale: `C` },
		{ prefix: `vert`, value: `vertical\vtab`, locale: `C.UTF-8` },
	])(
		`Bash preserves its emitted quoting for the next provider: $prefix`,
		({ prefix, value, locale }) => {
			const result = runLineEditor(
				`bash`,
				`comline-fixture pr list --base ${prefix}\t --confirm \t`,
				`global`,
				{ ...mode(`global`), LC_ALL: locale },
			)
			expect(JSON.parse(result).opts).toEqual({
				base: value,
				confirm: `preserved`,
			})
		},
	)

	test.each([
		``,
		`~`,
		`...`,
		`nested/...`,
		`vertical\vtab`,
		`literal\\u000b`,
		`literal\\u{b}`,
	])(`Nushell replacements preserve literal argument %j`, (value) => {
		const candidates: { value: string; display: string }[] = JSON.parse(
			run(
				`comline-fixture`,
				[`_comline`, `nushell`, `pr`, `list`, `--base`, ``],
				mode(`global`),
			),
		)
		const candidate = candidates.find((item) => item.display === value)!
		const result = run(
			`nu`,
			[
				`--no-config-file`,
				`-c`,
				`^node -e 'console.log(JSON.stringify(process.argv.slice(1)))' -- ${candidate.value}`,
			],
			mode(`global`),
		)
		expect(JSON.parse(result)).toEqual([value])
		const repeated: { display: string }[] = JSON.parse(
			run(
				`comline-fixture`,
				[
					`_comline`,
					`nushell`,
					`pr`,
					`list`,
					`--base`,
					candidate.value.trimEnd(),
				],
				mode(`global`),
			),
		)
		expect(repeated.some((item) => item.display === value)).toBe(true)
		// Previously inserted replacements must also survive the next request.
		const next = JSON.parse(
			run(
				`comline-fixture`,
				[
					`_comline`,
					`nushell`,
					`pr`,
					`list`,
					`--base`,
					candidate.value.trimEnd(),
					`--state`,
					`cl`,
				],
				mode(`global`),
			),
		)
		expect(next).toMatchObject([{ display: `closed` }])
	})

	test.each(interactiveShells)(
		`%s completes the installation command`,
		(shell) => {
			const result = runLineEditor(
				shell,
				`comline-fixture co\tin\tba\t`,
				`global`,
			)
			expect(JSON.parse(result).response).toContain(
				path.join(
					directory,
					`global`,
					`bash-completion/completions/comline-fixture.bash`,
				),
			)
			expect(
				existsSync(
					path.join(
						directory,
						`global`,
						`bash-completion/completions/comline-fixture.bash`,
					),
				),
			).toBe(true)
		},
	)

	test.each(completionTargets)(
		`%s library installation replaces its file and preserves shell profiles`,
		async (shell) => {
			// CLI installation is exercised by setup and the line-editor tests. Also
			// exercise the public library entry point, which V8 can measure directly.
			const previous = process.env
			process.env = mode(`global`)
			try {
				const profiles = [
					`home/.bashrc`,
					`zsh-config/.zshenv`,
					`zsh-config/.zshrc`,
					`config/fish/config.fish`,
					`config/nushell/config.nu`,
					`config/nushell/env.nu`,
				].map((file) => path.join(directory, file))
				const before = profiles.map((file) => readFileSync(file, `utf8`))
				const installed = await installCompletion(`comline-fixture`, shell)
				expect(readFileSync(installed, `utf8`)).not.toBe(
					`# outdated completion\n`,
				)
				expect(completeInstalledValue(shell, `global`)).toBe(`closed`)
				writeFileSync(installed, `# outdated completion\n`)
				expect(await installCompletion(`comline-fixture`, shell)).toBe(installed)
				expect(readFileSync(installed, `utf8`)).not.toBe(
					`# outdated completion\n`,
				)
				expect(completeInstalledValue(shell, `global`)).toBe(`closed`)
				expect(profiles.map((file) => readFileSync(file, `utf8`))).toEqual(
					before,
				)
			} finally {
				process.env = previous
			}
		},
	)

	test.each([`comline-fixture`, `cobra-fixture`])(
		`Carapace reads %s and renders Nushell candidates`,
		(name) => {
			const result = JSON.parse(
				run(
					`carapace`,
					[name, `nushell`, name, `pr`, `list`, `--base`, `ma`],
					mode(`global`),
				),
			)
			expect(
				result.map((item: { value: string }) => item.value).toSorted(),
			).toEqual([`main `, `maintenance `].toSorted())
			expect(
				result.find((item: { value: string }) => item.value === `main `)
					?.description,
			).toBe(`Main branch`)
		},
	)
	test(`Fish exposes exactly the provider's candidates`, () => {
		const result = run(
			`fish`,
			[`-i`, `-c`, `complete -C 'comline-fixture pr list --token pla'`],
			mode(`global`),
		)
		expect(result.trim().split(`\n`)).toEqual([`plain`])
	})

	test(`Fish repeated Tab completion never selects a fabricated value`, () => {
		const result = runLineEditor(
			`fish`,
			`comline-fixture pr list --token pla\t\t\t`,
			`global`,
		)
		expect(JSON.parse(result).opts).toEqual({ token: `plain` })
	})

	test(`Nushell autoload composes with Carapace and other command registrations`, () => {
		const config = path.join(directory, `config/nushell/config.nu`)
		const other = path.join(
			directory,
			`global`,
			`data/nushell/vendor/autoload/other-fixture.nu`,
		)
		const otherExecutable = path.join(directory, `global/bin`, `other-fixture`)
		symlinkSync(`comline-fixture`, otherExecutable)
		writeFileSync(other, completionScript(`other-fixture`, `nushell`))
		try {
			withProfile(
				config,
				`$env.config.completions.external.completer = {|spans| carapace $spans.0 nushell ...$spans | from json }\n`,
				() => {
					// Both the installed native handler and the pre-existing Carapace
					// provider remain reachable after a second command is autoloaded.
					for (const name of [
						`comline-fixture`,
						`other-fixture`,
						`cobra-fixture`,
					]) {
						const script = `print (do $env.config.completions.external.completer [${name} pr li] | to json); exit`
						const result = JSON.parse(
							run(`nu`, [`-i`, `--execute`, script], mode(`global`)),
						)
						expect(result.map((item: { value: string }) => item.value)).toEqual([
							`list `,
						])
					}
				},
			)
		} finally {
			rmSync(other)
			rmSync(otherExecutable)
		}
	})
})

// Packaging needs discovery and execution coverage for every consumer, while the
// detailed quoting, spacing, and installation scenarios run once above.
describe(`compiled`, { timeout: 30_000 }, () => {
	test.each(interactiveShells)(
		`%s discovers the installed integration and completes a value`,
		(shell) => {
			const result = runLineEditor(
				shell,
				`comline-fixture pr list --state cl\t`,
				`compiled`,
			)
			expect(inputValues(JSON.parse(result))).toEqual(
				inputValues({
					case: `pr/list`,
					path: [`pr`, `list`],
					opts: { state: `closed` },
				}),
			)
		},
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

test(`Bash installation checks that bash-completion is enabled`, () => {
	withProfile(
		path.join(directory, `home/.bashrc`),
		`unset -f _get_comp_words_by_ref _filedir\n`,
		() => {
			expect(() =>
				run(
					`comline-fixture`,
					[`completion`, `install`, `bash`],
					mode(`global`),
				),
			).toThrow()
		},
	)
})

test(`Bash discovers unexported user directory settings and creates missing directories`, () => {
	const rc = path.join(directory, `home/.bashrc`)
	const custom = path.join(directory, `custom-bash-completions`)
	withProfile(
		rc,
		readFileSync(rc, `utf8`) +
			`BASH_COMPLETION_USER_DIR='${custom}'\nexport -n BASH_COMPLETION_USER_DIR\nprintf 'startup output\\n'\n`,
		() => {
			const file = path.join(custom, `completions/comline-fixture.bash`)
			run(`comline-fixture`, [`completion`, `install`, `bash`], mode(`global`))
			expect(existsSync(file)).toBe(true)
			expect(completeInstalledValue(`bash`, `global`)).toBe(`closed`)
		},
	)
})

test(`Bash installation preserves spaces in an unexported directory setting`, () => {
	const rc = path.join(directory, `home/.bashrc`)
	const custom = path.join(directory, `custom bash completions`)
	withProfile(
		rc,
		readFileSync(rc, `utf8`) +
			`BASH_COMPLETION_USER_DIR='${custom}'\nexport -n BASH_COMPLETION_USER_DIR\nprintf 'startup output\\n'\n`,
		() => {
			const file = path.join(custom, `completions/comline-fixture.bash`)
			run(`comline-fixture`, [`completion`, `install`, `bash`], mode(`global`))
			expect(existsSync(file)).toBe(true)
			// bash-completion 2.11 splits spaced search paths when autoloading.
			// Check Comline's installation path here; native completion runs above.
		},
	)
})

test(`Zsh installation requires completion initialization`, () => {
	const rc = path.join(directory, `zsh-config/.zshrc`)
	withProfile(rc, readFileSync(rc, `utf8`) + `unfunction compdef\n`, () => {
		expect(() =>
			run(`comline-fixture`, [`completion`, `install`, `zsh`], mode(`compiled`)),
		).toThrow()
	})
})

test(`Zsh installation fails when its search path has no writable directory`, () => {
	const rc = path.join(directory, `zsh-config/.zshrc`)
	const readonly = path.join(directory, `readonly-functions`)
	mkdirSync(readonly)
	chmodSync(readonly, 0o555)
	try {
		withProfile(rc, readFileSync(rc, `utf8`) + `fpath=('${readonly}')\n`, () => {
			expect(() =>
				run(
					`comline-fixture`,
					[`completion`, `install`, `zsh`],
					mode(`compiled`),
				),
			).toThrow()
			expect(existsSync(path.join(readonly, `_comline-fixture`))).toBe(false)
		})
	} finally {
		chmodSync(readonly, 0o755)
	}
})

test(`Fish installation respects a higher-priority user completion`, () => {
	const completions = path.join(directory, `config/fish/completions`)
	mkdirSync(completions, { recursive: true })
	const override = path.join(completions, `comline-fixture.fish`)
	writeFileSync(override, `# user override\n`)
	try {
		expect(() =>
			run(`comline-fixture`, [`completion`, `install`, `fish`], mode(`global`)),
		).toThrow()
		expect(readFileSync(override, `utf8`)).toBe(`# user override\n`)
	} finally {
		rmSync(override)
	}
})

test(`Fish installation fails if its user vendor directory is not searched`, () => {
	withProfile(
		path.join(directory, `config/fish/config.fish`),
		`set fish_complete_path '${directory}/custom-fish-path'\n`,
		() => {
			expect(() =>
				run(
					`comline-fixture`,
					[`completion`, `install`, `fish`],
					mode(`compiled`),
				),
			).toThrow()
			expect(existsSync(path.join(directory, `custom-fish-path`))).toBe(false)
		},
	)
})

test.each(completionTargets)(
	`installation explains a missing %s executable`,
	(target) => {
		expect(() =>
			run(
				path.join(directory, `compiled/comline-fixture`),
				[`completion`, `install`, target],
				{ ...mode(`compiled`), PATH: directory },
			),
		).toThrow(target === `nushell` ? `nu` : target)
	},
)

test(`Bash installation falls back to its XDG user directory`, () => {
	const env = { ...mode(`global`), BASH_COMPLETION_USER_DIR: undefined }
	const file = path.join(
		directory,
		`global/data/bash-completion/completions/comline-fixture.bash`,
	)
	run(`comline-fixture`, [`completion`, `install`, `bash`], env)
	expect(existsSync(file)).toBe(true)
	expect(completeInstalledValue(`bash`, `global`, env)).toBe(`closed`)
})

test(`Zsh installation rejects insecure completion directories`, () => {
	const rc = path.join(directory, `zsh-config/.zshrc`)
	const insecure = path.join(directory, `insecure-install-functions`)
	mkdirSync(insecure)
	chmodSync(insecure, 0o777)
	withProfile(rc, readFileSync(rc, `utf8`) + `fpath=('${insecure}')\n`, () => {
		expect(() =>
			run(`comline-fixture`, [`completion`, `install`, `zsh`], mode(`compiled`)),
		).toThrow()
		expect(existsSync(path.join(insecure, `_comline-fixture`))).toBe(false)
	})
})

test(`installation refuses a symlink without changing its target`, () => {
	const file = path.join(
		directory,
		`global/bash-completion/completions/comline-fixture.bash`,
	)
	const target = path.join(directory, `user-owned-file`)
	const original = readFileSync(file, `utf8`)
	writeFileSync(target, `keep this\n`)
	rmSync(file)
	symlinkSync(target, file)
	try {
		expect(() =>
			run(`comline-fixture`, [`completion`, `install`, `bash`], mode(`global`)),
		).toThrow()
		expect(readFileSync(target, `utf8`)).toBe(`keep this\n`)
	} finally {
		rmSync(file)
		writeFileSync(file, original)
	}
})

test.each([`nushell`, `carapace`] as const)(
	`%s discovers custom XDG paths containing spaces`,
	(target) => {
		const { env, expected } = prepareCustomXdgPaths(target)
		run(`comline-fixture`, [`completion`, `install`, target], env)
		expect(existsSync(expected)).toBe(true)
		expect(completeInstalledValue(target, `compiled`, env)).toBe(`closed`)
		if (target === `carapace`) {
			const result = JSON.parse(
				run(
					`carapace`,
					[`comline-fixture`, `nushell`, `comline-fixture`, `pr`, `li`],
					env,
				),
			)
			expect(result.map((item: { value: string }) => item.value)).toEqual([
				`list `,
			])
		}
	},
)

test.each([`nushell`, `carapace`] as const)(
	`%s refuses an unwritable destination`,
	(target) => {
		const readonly = path.join(directory, `readonly-${target}`)
		mkdirSync(readonly)
		chmodSync(readonly, 0o555)
		const env = {
			...mode(`compiled`),
			...(target === `nushell`
				? { XDG_DATA_HOME: readonly }
				: { XDG_CONFIG_HOME: readonly }),
		}
		try {
			expect(() =>
				run(`comline-fixture`, [`completion`, `install`, target], env),
			).toThrow()
		} finally {
			chmodSync(readonly, 0o755)
		}
	},
)

test.each([`system-data/nushell/vendor/autoload`, `config/nushell/autoload`])(
	`Nushell refuses a duplicate registration in %s`,
	(relative) => {
		const folder = path.join(directory, relative)
		mkdirSync(folder, { recursive: true })
		const existing = path.join(folder, `comline-fixture.nu`)
		writeFileSync(existing, `# existing registration\n`)
		try {
			expect(() =>
				run(
					`comline-fixture`,
					[`completion`, `install`, `nushell`],
					mode(`compiled`),
				),
			).toThrow()
			expect(readFileSync(existing, `utf8`)).toBe(`# existing registration\n`)
		} finally {
			rmSync(existing)
		}
	},
)

test(`Nushell preserves an explicit setting disabling external completions`, () => {
	const config = path.join(directory, `config/nushell/config.nu`)
	withProfile(
		config,
		`$env.config.completions.external.enable = false\n`,
		() => {
			expect(() =>
				run(
					`comline-fixture`,
					[`completion`, `install`, `nushell`],
					mode(`compiled`),
				),
			).toThrow()
			// The already installed autoload file must also respect this preference.
			expect(
				run(
					`nu`,
					[
						`-i`,
						`--execute`,
						`print $env.config.completions.external.enable; exit`,
					],
					mode(`compiled`),
				).trim(),
			).toBe(`false`)
		},
	)
})

test.each([`nushell`, `carapace`] as const)(
	`%s installation needs only its own consumer on PATH`,
	(target) => {
		const bin = path.join(directory, `only-${target}`)
		mkdirSync(bin)
		const consumer = target === `nushell` ? `nu` : `carapace`
		// Resolve before restricting PATH; the compiled CLI itself needs no JS runtime.
		const executable = run(`bash`, [
			`-c`,
			`command -v "$1"`,
			`bash`,
			consumer,
		]).trim()
		symlinkSync(executable, path.join(bin, consumer))
		const env: NodeJS.ProcessEnv = { ...mode(`compiled`), PATH: bin }
		run(
			path.join(directory, `compiled/comline-fixture`),
			[`completion`, `install`, target],
			env,
		)
		expect(
			existsSync(
				target === `nushell`
					? path.join(
							env[`XDG_DATA_HOME`]!,
							`nushell/vendor/autoload/comline-fixture.nu`,
						)
					: path.join(
							env[`XDG_CONFIG_HOME`]!,
							`carapace/specs/comline-fixture.yaml`,
						),
			),
		).toBe(true)
	},
)

test(`Bash installation rejects an extensionless completion in the destination directory`, () => {
	const folder = path.join(directory, `compiled/bash-completion/completions`)
	const override = path.join(folder, `comline-fixture`)
	const installed = path.join(folder, `comline-fixture.bash`)
	const previous = readFileSync(installed, `utf8`)
	writeFileSync(override, `complete -W old-completion comline-fixture\n`)
	try {
		expect(() =>
			run(
				`comline-fixture`,
				[`completion`, `install`, `bash`],
				mode(`compiled`),
			),
		).toThrow()
		expect(readFileSync(override, `utf8`)).toBe(
			`complete -W old-completion comline-fixture\n`,
		)
		expect(readFileSync(installed, `utf8`)).toBe(previous)
	} finally {
		rmSync(override)
	}
})

test.each([`bash`, `zsh`] as const)(
	`%s discovers completion settings from login startup`,
	(shell) => {
		const { profile, rc, custom, script, startup } =
			prepareLoginCompletionPaths(shell)
		withProfile(profile, script, () => {
			withProfile(rc, startup, () => {
				const file = path.join(
					custom,
					shell === `bash`
						? `completions/comline-fixture.bash`
						: `_comline-fixture`,
				)
				run(
					`comline-fixture`,
					[`completion`, `install`, shell],
					mode(`compiled`),
				)
				expect(existsSync(file)).toBe(true)
				expect(completeInstalledValue(shell, `compiled`)).toBe(`closed`)
			})
		})
	},
)

test(`Bash discovery falls back to non-login initialization`, () => {
	withProfile(
		path.join(directory, `home/.bash_profile`),
		`unset -f _get_comp_words_by_ref _filedir\n`,
		() => {
			const file = path.join(
				directory,
				`compiled/bash-completion/completions/comline-fixture.bash`,
			)
			run(`comline-fixture`, [`completion`, `install`, `bash`], mode(`compiled`))
			expect(existsSync(file)).toBe(true)
		},
	)
})
