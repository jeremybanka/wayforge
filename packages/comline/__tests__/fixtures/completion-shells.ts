import { execFileSync } from "node:child_process"
import {
	mkdirSync,
	mkdtempSync,
	readFileSync,
	rmSync,
	writeFileSync,
} from "node:fs"
import { tmpdir } from "node:os"
import path from "node:path"

import { packComline } from "../fixtures/comline-workspace"

export let directory: string
export let environment: NodeJS.ProcessEnv

export function run(
	executable: string,
	args: string[],
	env: NodeJS.ProcessEnv = environment,
	cwd: string = directory,
): string {
	return execFileSync(executable, args, {
		cwd,
		env,
		encoding: `utf8`,
		timeout: 60_000,
		stdio: [`ignore`, `pipe`, `pipe`],
	})
}
export function mode(kind: string): NodeJS.ProcessEnv {
	return {
		...environment,
		XDG_DATA_HOME: path.join(directory, kind, `data`),
		BASH_COMPLETION_USER_DIR: path.join(directory, kind, `bash-completion`),
		COMLINE_ZSH_COMPLETIONS: path.join(directory, kind, `site-functions`),
		PATH:
			path.join(directory, kind === `compiled` ? `compiled` : `global/bin`) +
			path.delimiter +
			environment[`PATH`],
	}
}

let completionCounter = 0

export function completeInstalledValue(
	shell: `bash` | `zsh` | `fish` | `nushell` | `carapace`,
	kind: string,
	env: NodeJS.ProcessEnv = mode(kind),
): string {
	const consumer =
		shell === `nushell` ? `nu` : shell === `carapace` ? `nu-carapace` : shell
	const output = path.join(directory, `installed-${completionCounter++}.json`)
	let setup = path.join(directory, shell === `carapace` ? `nu-carapace` : shell)
	if (shell === `bash` || shell === `zsh`) {
		setup = `${output}.setup`
		writeFileSync(
			setup,
			shell === `bash`
				? `source '${directory}/home/.bash_profile'\n`
				: `source '${directory}/zsh-config/.zprofile'\nsource '${directory}/zsh-config/.zshrc'\n`,
		)
	}
	const result: { opts: { state: string } } = JSON.parse(
		run(
			`bun`,
			[
				path.join(import.meta.dirname, `shell-completion.bun.ts`),
				consumer,
				setup,
				output,
				`comline-fixture pr list --state cl\t`,
			],
			env,
		),
	)
	return result.opts.state
}

beforeAll(() => {
	directory = mkdtempSync(path.join(tmpdir(), `comline-completions-`))
	environment = {
		...process.env,
		BASH_COMPLETION_USER_FILE: `/dev/null`,
		HOME: path.join(directory, `home`),
		XDG_CONFIG_HOME: path.join(directory, `config`),
		XDG_CACHE_HOME: path.join(directory, `cache`),
		XDG_DATA_DIRS: path.join(directory, `system-data`),
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
		`pnpm`,
	]) {
		run(tool, [`--version`])
	}
	const fixture = path.join(directory, `package`)
	mkdirSync(fixture)
	mkdirSync(path.join(directory, `config/carapace/specs`), { recursive: true })
	mkdirSync(path.join(directory, `zsh-config`))
	mkdirSync(path.join(directory, `folder with spaces`))
	writeFileSync(path.join(directory, `file with spaces.txt`), ``)
	writeFileSync(path.join(directory, `key=file.txt`), ``)
	for (const name of [
		`star-expanded-branch`,
		`questionXbranch`,
		`globstar*file`,
		`globstar-expanded-file`,
		`globquestion?file`,
		`globquestionXfile`,
	]) {
		writeFileSync(path.join(directory, name), ``)
	}
	const packageDirectory = path.join(import.meta.dirname, `../..`)
	// Build and pack a copy: cleaning the checkout's dist would race with other
	// packages importing Comline. Keep the real release config and manifest.
	const comline = packComline(
		packageDirectory,
		path.join(directory, `workspace`),
		(args, cwd) => {
			run(`pnpm`, args, environment, cwd)
		},
	)
	const pack = (source: string, name: string): string => {
		const archive = path.join(directory, `${name}.tgz`)
		run(`pnpm`, [`pack`, `--out`, archive], environment, source)
		return archive
	}
	const treetrunks = pack(
		path.join(packageDirectory, `../treetrunks`),
		`treetrunks`,
	)
	const standardSchema = pack(
		path.join(packageDirectory, `node_modules/@standard-schema/spec`),
		`standard-schema`,
	)
	run(`bun`, [
		`build`,
		path.join(import.meta.dirname, `../fixtures/completion.x.ts`),
		`--target=node`,
		`--external=comline`,
		`--outfile=${fixture}/cli.js`,
	])
	run(`bun`, [
		`build`,
		path.join(import.meta.dirname, `../fixtures/completion.x.ts`),
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
			dependencies: { comline: `file:${comline}` },
		}),
	)
	run(`npm`, [
		`install`,
		`--global`,
		`--prefix`,
		path.join(directory, `global`),
		pack(fixture, `fixture`),
		treetrunks,
		standardSchema,
		`--offline`,
		`--legacy-peer-deps`,
		`--ignore-scripts`,
		`--no-audit`,
		`--no-fund`,
	])

	mkdirSync(path.join(directory, `config/nushell`), { recursive: true })
	writeFileSync(
		path.join(directory, `config/nushell/config.nu`),
		`# user configuration\n`,
	)
	writeFileSync(
		path.join(directory, `config/nushell/env.nu`),
		`# user environment\n`,
	)
	mkdirSync(path.join(directory, `home`), { recursive: true })
	writeFileSync(path.join(directory, `home/home-only.txt`), ``)
	mkdirSync(path.join(directory, `config/fish`), { recursive: true })
	const bashCompletion =
		process.env[`BASH_COMPLETION_FILE`] ??
		`/usr/share/bash-completion/bash_completion`
	writeFileSync(
		path.join(directory, `home/.bashrc`),
		`source '${bashCompletion}'\n`,
	)
	writeFileSync(
		path.join(directory, `home/.bash_profile`),
		`source '${directory}/home/.bashrc'\n`,
	)
	writeFileSync(path.join(directory, `zsh-config/.zprofile`), ``)
	writeFileSync(
		path.join(directory, `zsh-config/.zshenv`),
		`setopt no_global_rcs\n`,
	)
	writeFileSync(
		path.join(directory, `zsh-config/.zshrc`),
		`fpath=("$COMLINE_ZSH_COMPLETIONS" $fpath)\nautoload -Uz compinit; compinit -i -D\n`,
	)
	writeFileSync(
		path.join(directory, `config/fish/config.fish`),
		`# user's configuration\n`,
	)
	for (const shell of [`bash`, `zsh`, `fish`] as const) {
		writeFileSync(
			path.join(directory, shell),
			shell === `zsh`
				? `fpath=("$COMLINE_ZSH_COMPLETIONS" $fpath)\ncompinit -i -D\n`
				: `# rely on completion file discovery\n`,
		)
	}
	writeFileSync(
		path.join(directory, `nushell`),
		`# rely on vendor autoload discovery\n`,
	)
	for (const kind of [`global`, `compiled`]) {
		for (const shell of [`bash`, `zsh`, `fish`, `nushell`, `carapace`]) {
			run(`comline-fixture`, [`completion`, `install`, shell], mode(kind))
		}
	}
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

export function withProfile(
	file: string,
	contents: string,
	check: () => void,
): void {
	const previous = readFileSync(file, `utf8`)
	try {
		writeFileSync(file, contents)
		check()
	} finally {
		writeFileSync(file, previous)
	}
}

export const completionTargets = [
	`bash`,
	`zsh`,
	`fish`,
	`nushell`,
	`carapace`,
] as const
export const interactiveShells = [
	`bash`,
	`zsh`,
	`fish`,
	`nu`,
	`nu-carapace`,
	`nu-cobra`,
] as const

let lineEditorCounter = 0

export function runLineEditor(
	shell: string,
	line: string,
	kind: `global` | `compiled`,
	env: NodeJS.ProcessEnv = mode(kind),
): string {
	return run(
		`bun`,
		[
			path.join(import.meta.dirname, `shell-completion.bun.ts`),
			shell,
			path.join(directory, shell === `nu` ? `nushell` : shell),
			path.join(directory, `output-${lineEditorCounter++}.json`),
			line,
		],
		env,
	)
}

export function prepareCustomXdgPaths(target: `nushell` | `carapace`) {
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
	return { env, expected }
}

export function prepareLoginCompletionPaths(shell: `bash` | `zsh`) {
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
	return { profile, rc, custom, script, startup }
}
