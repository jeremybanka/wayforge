import {
	chmodSync,
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
	completionTargets,
	directory,
	interactiveShells,
	mode,
	prepareCustomXdgPaths,
	prepareLoginCompletionPaths,
	run,
	runLineEditor,
	withProfile,
} from "../fixtures/completion-shells"

beforeAll(() => {
	const version = run(`fish`, [`--version`])
	expect(
		Number(version.match(/\d+/)?.[0]),
		`Fish 4+ is required`,
	).toBeGreaterThanOrEqual(4)
})

describe(`global`, { timeout: 30_000 }, () => {
	test.each(interactiveShells)(
		`%s prints the exact installation confirmation after command completion`,
		(shell) => {
			const result = runLineEditor(
				shell,
				`comline-fixture co\tin\tba\t`,
				`global`,
			)
			expect(JSON.parse(result).response).toBe(
				`Installed completions at ${path.join(directory, `global`, `bash-completion/completions/comline-fixture.bash`)}\n`,
			)
		},
	)

	test.each(completionTargets)(
		`%s library installation writes and replaces with exact generator bytes`,
		async (shell) => {
			// CLI installation is exercised by setup and the line-editor tests. Also
			// exercise the public library entry point, which V8 can measure directly.
			const previous = process.env
			process.env = mode(`global`)
			try {
				const installed = await installCompletion(`comline-fixture`, shell)
				expect(readFileSync(installed, `utf8`)).toBe(
					completionScript(`comline-fixture`, shell),
				)
				writeFileSync(installed, `# outdated completion\n`)
				await installCompletion(`comline-fixture`, shell)
				expect(readFileSync(installed, `utf8`)).toBe(
					completionScript(`comline-fixture`, shell),
				)
			} finally {
				process.env = previous
			}
		},
	)

	test.each([`comline-fixture`, `cobra-fixture`])(
		`Carapace orders %s candidates and places the description on the first result`,
		(name) => {
			const result = JSON.parse(
				run(
					`carapace`,
					[name, `nushell`, name, `pr`, `list`, `--base`, `ma`],
					mode(`global`),
				),
			)
			expect(result.map((item: { value: string }) => item.value)).toEqual([
				`main `,
				`maintenance `,
			])
			expect(result[0].description).toBe(`Main branch`)
		},
	)

	test(`Fish uses native spacing for a plain candidate`, () => {
		const result = runLineEditor(
			`fish`,
			`comline-fixture pr list --token pla\t--base main`,
			`global`,
		)
		expect(JSON.parse(result).opts).toEqual({ token: `plain`, base: `main` })
	})

	test.each(completionTargets)(
		`the executable emits the exact %s generator bytes`,
		(target) => {
			expect(
				run(`comline-fixture`, [`completion`, target], mode(`global`)),
			).toBe(completionScript(`comline-fixture`, target))
		},
	)
})

// Packaging needs discovery and execution coverage for every consumer, while the
// detailed quoting, spacing, and installation scenarios run once above.
describe(`compiled`, { timeout: 30_000 }, () => {
	test.each(interactiveShells)(
		`%s completion produces the exact compiled CLI response shape`,
		(shell) => {
			const result = runLineEditor(
				shell,
				`comline-fixture pr list --state cl\t`,
				`compiled`,
			)
			expect(JSON.parse(result)).toEqual({
				case: `pr/list`,
				path: [`pr`, `list`],
				opts: { state: `closed` },
			})
		},
	)
	test.each(completionTargets)(
		`the executable emits the exact %s generator bytes`,
		(target) => {
			expect(
				run(`comline-fixture`, [`completion`, target], mode(`compiled`)),
			).toBe(completionScript(`comline-fixture`, target))
		},
	)
})

test(`Bash names bash-completion in its missing-initialization error`, () => {
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
			).toThrow(/Install bash-completion and enable it/)
		},
	)
})

test(`Bash uses exact confirmation wording and generator bytes for an unexported spaced path`, () => {
	const rc = path.join(directory, `home/.bashrc`)
	const custom = path.join(directory, `custom bash completions`)
	withProfile(
		rc,
		readFileSync(rc, `utf8`) +
			`BASH_COMPLETION_USER_DIR='${custom}'\nexport -n BASH_COMPLETION_USER_DIR\nprintf 'startup output\\n'\n`,
		() => {
			const file = path.join(custom, `completions/comline-fixture.bash`)
			expect(
				run(
					`comline-fixture`,
					[`completion`, `install`, `bash`],
					mode(`global`),
				),
			).toBe(`Installed completions at ${file}\n`)
			expect(readFileSync(file, `utf8`)).toBe(
				completionScript(`comline-fixture`, `bash`),
			)
		},
	)
})

test(`Zsh names completion initialization in its error`, () => {
	const rc = path.join(directory, `zsh-config/.zshrc`)
	withProfile(rc, readFileSync(rc, `utf8`) + `unfunction compdef\n`, () => {
		expect(() =>
			run(`comline-fixture`, [`completion`, `install`, `zsh`], mode(`compiled`)),
		).toThrow(/Enable Zsh completion/)
	})
})

test(`Zsh uses the no-writable-directory error wording`, () => {
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
			).toThrow(/No writable zsh completion directory/)
		})
	} finally {
		chmodSync(readonly, 0o755)
	}
})

test(`Fish describes a higher-priority completion as taking precedence`, () => {
	const completions = path.join(directory, `config/fish/completions`)
	mkdirSync(completions, { recursive: true })
	const override = path.join(completions, `comline-fixture.fish`)
	writeFileSync(override, `# user override\n`)
	try {
		expect(() =>
			run(`comline-fixture`, [`completion`, `install`, `fish`], mode(`global`)),
		).toThrow(/takes precedence/)
	} finally {
		rmSync(override)
	}
})

test(`Fish uses the no-writable-directory error wording for an unsearched vendor path`, () => {
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
			).toThrow(/No writable fish completion directory/)
		},
	)
})

test.each(completionTargets)(
	`installation names the missing %s executable in its error`,
	(target) => {
		expect(() =>
			run(
				path.join(directory, `compiled/comline-fixture`),
				[`completion`, `install`, target],
				{ ...mode(`compiled`), PATH: directory },
			),
		).toThrow(`Check that ${target === `nushell` ? `nu` : target} is installed`)
	},
)

test(`Bash uses exact confirmation wording and generator bytes for the XDG destination`, () => {
	const env = { ...mode(`global`), BASH_COMPLETION_USER_DIR: undefined }
	const file = path.join(
		directory,
		`global/data/bash-completion/completions/comline-fixture.bash`,
	)
	expect(run(`comline-fixture`, [`completion`, `install`, `bash`], env)).toBe(
		`Installed completions at ${file}\n`,
	)
	expect(readFileSync(file, `utf8`)).toBe(
		completionScript(`comline-fixture`, `bash`),
	)
})

test(`Zsh describes insecure directories as having no writable destination`, () => {
	const rc = path.join(directory, `zsh-config/.zshrc`)
	const insecure = path.join(directory, `insecure-install-functions`)
	mkdirSync(insecure)
	chmodSync(insecure, 0o777)
	withProfile(rc, readFileSync(rc, `utf8`) + `fpath=('${insecure}')\n`, () => {
		expect(() =>
			run(`comline-fixture`, [`completion`, `install`, `zsh`], mode(`compiled`)),
		).toThrow(/No writable zsh completion directory/)
	})
})

test(`installation describes a symlink destination as not a regular file`, () => {
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
		).toThrow(/not a regular file/)
	} finally {
		rmSync(file)
		writeFileSync(file, original)
	}
})

test.each([`nushell`, `carapace`] as const)(
	`%s uses exact confirmation wording and generator bytes for spaced XDG paths`,
	(target) => {
		const { env, expected } = prepareCustomXdgPaths(target)
		expect(run(`comline-fixture`, [`completion`, `install`, target], env)).toBe(
			`Installed completions at ${expected}\n`,
		)
		expect(readFileSync(expected, `utf8`)).toBe(
			completionScript(`comline-fixture`, target),
		)
	},
)

test.each([`nushell`, `carapace`] as const)(
	`%s uses the no-writable-directory error wording`,
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
			).toThrow(`No writable ${target} completion directory`)
		} finally {
			chmodSync(readonly, 0o755)
		}
	},
)

test.each([`system-data/nushell/vendor/autoload`, `config/nushell/autoload`])(
	`Nushell describes a duplicate registration in %s as also autoloaded`,
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
			).toThrow(/is also autoloaded/)
		} finally {
			rmSync(existing)
		}
	},
)

test(`Nushell names disabled external completions in its error`, () => {
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
			).toThrow(/external completions are disabled/)
			// The already installed autoload file must also respect this preference.
		},
	)
})

test.each([`nushell`, `carapace`] as const)(
	`%s uses the installation confirmation prefix with only its own consumer on PATH`,
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
		const env = { ...mode(`compiled`), PATH: bin }
		expect(
			run(
				path.join(directory, `compiled/comline-fixture`),
				[`completion`, `install`, target],
				env,
			),
		).toContain(`Installed completions at `)
	},
)

test(`Bash reports precedence for an extensionless completion already loaded`, () => {
	const folder = path.join(directory, `compiled/bash-completion/completions`)
	const override = path.join(folder, `comline-fixture`)
	writeFileSync(override, `complete -W old-completion comline-fixture\n`)
	try {
		// Confirm actual bash-completion filename precedence in a fresh shell.
		expect(
			run(
				`bash`,
				[
					`-i`,
					`-c`,
					`_completion_loader comline-fixture; complete -p comline-fixture`,
				],
				mode(`compiled`),
			),
		).toContain(`old-completion`)
		expect(() =>
			run(
				`comline-fixture`,
				[`completion`, `install`, `bash`],
				mode(`compiled`),
			),
		).toThrow(/takes precedence/)
	} finally {
		rmSync(override)
	}
})

test.each([`bash`, `zsh`] as const)(
	`%s uses exact confirmation wording and generator bytes for login settings`,
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
				expect(
					run(
						`comline-fixture`,
						[`completion`, `install`, shell],
						mode(`compiled`),
					),
				).toBe(`Installed completions at ${file}\n`)
				expect(readFileSync(file, `utf8`)).toBe(
					completionScript(`comline-fixture`, shell),
				)
			})
		})
	},
)

test(`Bash uses exact confirmation wording after non-login fallback`, () => {
	withProfile(
		path.join(directory, `home/.bash_profile`),
		`unset -f _get_comp_words_by_ref _filedir\n`,
		() => {
			const file = path.join(
				directory,
				`compiled/bash-completion/completions/comline-fixture.bash`,
			)
			expect(
				run(
					`comline-fixture`,
					[`completion`, `install`, `bash`],
					mode(`compiled`),
				),
			).toBe(`Installed completions at ${file}\n`)
		},
	)
})
