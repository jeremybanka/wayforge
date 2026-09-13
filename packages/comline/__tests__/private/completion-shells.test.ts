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

let counter = 0

import { directory, mode, run, withProfile } from "../fixtures/completion-shells"

beforeAll(() => {
	const version = run(`fish`, [`--version`])
	expect(
		Number(version.match(/\d+/)?.[0]),
		`Fish 4+ is required`,
	).toBeGreaterThanOrEqual(4)
})

describe(`global`, { timeout: 30_000 }, () => {
	test.each([`bash`, `zsh`, `fish`, `nu`, `nu-carapace`, `nu-cobra`])(
		`%s completes the installation command`,
		(shell) => {
			const result = run(
				`bun`,
				[
					path.join(import.meta.dirname, `../fixtures/shell-completion.bun.ts`),
					shell,
					path.join(directory, shell === `nu` ? `nushell` : shell),
					path.join(directory, `output-${counter++}.json`),
					`comline-fixture co\tin\tba\t`,
				],
				mode(`global`),
			)
			expect(JSON.parse(result).response).toBe(
				`Installed completions at ${path.join(directory, `global`, `bash-completion/completions/comline-fixture.bash`)}\n`,
			)
		},
	)

	test.each([`bash`, `zsh`, `fish`, `nushell`, `carapace`] as const)(
		`%s library installation replaces its file and preserves shell profiles`,
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
		`Carapace reads %s and renders Nushell candidates`,
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
		const result = run(
			`bun`,
			[
				path.join(import.meta.dirname, `../fixtures/shell-completion.bun.ts`),
				`fish`,
				path.join(directory, `fish`),
				path.join(directory, `output-${counter++}.json`),
				`comline-fixture pr list --token pla\t--base main`,
			],
			mode(`global`),
		)
		expect(JSON.parse(result).opts).toEqual({ token: `plain`, base: `main` })
	})

	test.each([`bash`, `zsh`, `fish`, `nushell`, `carapace`] as const)(
		`the executable ships its %s integration`,
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
	test.each([`bash`, `zsh`, `fish`, `nu`, `nu-carapace`, `nu-cobra`])(
		`%s discovers the installed integration and completes a value`,
		(shell) => {
			const result = run(
				`bun`,
				[
					path.join(import.meta.dirname, `../fixtures/shell-completion.bun.ts`),
					shell,
					path.join(directory, shell === `nu` ? `nushell` : shell),
					path.join(directory, `output-${counter++}.json`),
					`comline-fixture pr list --state cl\t`,
				],
				mode(`compiled`),
			)
			expect(JSON.parse(result)).toEqual({
				case: `pr/list`,
				path: [`pr`, `list`],
				opts: { state: `closed` },
			})
		},
	)
	test.each([`bash`, `zsh`, `fish`, `nushell`, `carapace`] as const)(
		`the executable ships its %s integration`,
		(target) => {
			expect(
				run(`comline-fixture`, [`completion`, target], mode(`compiled`)),
			).toBe(completionScript(`comline-fixture`, target))
		},
	)
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
			).toThrow(/Install bash-completion and enable it/)
		},
	)
})

test(`Bash discovers unexported user directory settings and creates missing directories`, () => {
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

test(`Zsh installation requires completion initialization`, () => {
	const rc = path.join(directory, `zsh-config/.zshrc`)
	withProfile(rc, readFileSync(rc, `utf8`) + `unfunction compdef\n`, () => {
		expect(() =>
			run(`comline-fixture`, [`completion`, `install`, `zsh`], mode(`compiled`)),
		).toThrow(/Enable Zsh completion/)
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
			).toThrow(/No writable zsh completion directory/)
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
		).toThrow(/takes precedence/)
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
			).toThrow(/No writable fish completion directory/)
		},
	)
})

test.each([`bash`, `zsh`, `fish`, `nushell`, `carapace`])(
	`installation explains a missing %s executable`,
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

test(`Bash installation falls back to its XDG user directory`, () => {
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

test(`Zsh installation rejects insecure completion directories`, () => {
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
		).toThrow(/not a regular file/)
	} finally {
		rmSync(file)
		writeFileSync(file, original)
	}
})

test.each([`nushell`, `carapace`] as const)(
	`%s discovers custom XDG paths containing spaces`,
	(target) => {
		const config = path.join(directory, `custom config`)
		const data = path.join(directory, `custom data`)
		const env = {
			...mode(`compiled`),
			XDG_CONFIG_HOME: config,
			XDG_DATA_HOME: data,
		}
		mkdirSync(path.join(config, `nushell`), { recursive: true })
		writeFileSync(
			path.join(config, `nushell/config.nu`),
			`print "startup output"\n`,
		)
		const expected =
			target === `nushell`
				? path.join(data, `nushell/vendor/autoload/comline-fixture.nu`)
				: path.join(config, `carapace/specs/comline-fixture.yaml`)
		expect(run(`comline-fixture`, [`completion`, `install`, target], env)).toBe(
			`Installed completions at ${expected}\n`,
		)
		expect(readFileSync(expected, `utf8`)).toBe(
			completionScript(`comline-fixture`, target),
		)
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
			).toThrow(`No writable ${target} completion directory`)
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
			).toThrow(/is also autoloaded/)
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
			).toThrow(/external completions are disabled/)
			// The already installed autoload file must also respect this preference.
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

test(`Bash installation rejects an extensionless completion in the destination directory`, () => {
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
	`%s discovers completion settings from login startup`,
	(shell) => {
		const profile = path.join(
			directory,
			shell === `bash` ? `home/.bash_profile` : `zsh-config/.zprofile`,
		)
		const rc = path.join(
			directory,
			shell === `bash` ? `home/.bashrc` : `zsh-config/.zshrc`,
		)
		const custom = path.join(directory, `${shell}-login-completions`)
		mkdirSync(custom)
		const script =
			shell === `bash`
				? `source '${rc}'\nBASH_COMPLETION_USER_DIR='${custom}'\nexport -n BASH_COMPLETION_USER_DIR\n`
				: `fpath=('${custom}' $fpath)\n`
		const startup =
			shell === `bash`
				? readFileSync(rc, `utf8`)
				: `autoload -Uz compinit; compinit -i -D\n`
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

test(`Bash discovery falls back to non-login initialization`, () => {
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
