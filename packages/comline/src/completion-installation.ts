import { execFile } from "node:child_process"
import { constants } from "node:fs"
import {
	access,
	lstat,
	mkdir,
	mkdtemp,
	rename,
	rm,
	stat,
	writeFile,
} from "node:fs/promises"
import * as path from "node:path"
import { promisify } from "node:util"

/* eslint-disable quotes -- Import attributes require string literals. */
import bash from "./shells/discover-completions.bash" with { type: "text" }
import fish from "./shells/discover-completions.fish" with { type: "text" }
import nushell from "./shells/discover-completions.nu" with { type: "text" }
import zsh from "./shells/discover-completions.zsh" with { type: "text" }
/* eslint-enable quotes */

export type CompletionInstallTarget =
	| `bash`
	| `zsh`
	| `fish`
	| `nushell`
	| `carapace`

const execute = promisify(execFile)

async function inspectShell(shell: CompletionInstallTarget): Promise<{
	preferred: string
	directories: string[]
}> {
	const executable = shell === `nushell` ? `nu` : shell
	let stdout: string
	try {
		// Interactive startup reads the user's actual completion settings. Never
		// interpolate command names or paths into shell code. Startup may print text,
		// so frame our response with NULs, which cannot occur in filesystem paths.
		// Nu needs --execute: even nu -i -c skips its config and autoload files.
		const result = await execute(
			executable,
			shell === `carapace`
				? [`--help`]
				: shell === `nushell`
					? [`-i`, `--execute`, `${nushell}\nexit`]
					: [`-i`, `-c`, { bash, zsh, fish }[shell]],
			{
				timeout: 10_000,
				maxBuffer: 1024 * 1024,
				env: { ...process.env, TERM: process.env[`TERM`] ?? `dumb` },
			},
		)
		stdout = result.stdout
	} catch (cause) {
		throw new Error(
			`Could not inspect ${shell} completion settings. Check that ${executable} is installed and starts without errors or prompts.`,
			{ cause },
		)
	}
	if (shell === `carapace`) {
		// Carapace documents --help as the way to discover its effective spec path,
		// including platform defaults and XDG overrides. Do not guess a destination.
		const directory = stdout.match(
			/^\s*Specs are loaded from \[(.+)\]\.\s*$/m,
		)?.[1]
		if (!directory || !path.isAbsolute(directory))
			throw new Error(
				`Could not discover Carapace's specs directory from carapace --help.`,
			)
		return { preferred: directory, directories: [directory] }
	}
	const marker = `\0completion-install\0`
	const start = stdout.lastIndexOf(marker)
	if (start < 0)
		throw new Error(
			`Could not discover ${shell} completion settings. Check your shell startup configuration.`,
		)
	const [status, preferred = ``, ...directories] = stdout
		.slice(start + marker.length)
		.split(`\0`)
	if (status !== `ready`)
		throw new Error(status || `Could not discover ${shell} completion settings.`)
	return {
		preferred,
		directories: [...new Set(directories.filter((dir) => path.isAbsolute(dir)))],
	}
}

async function writableDirectory(directory: string): Promise<boolean> {
	try {
		const info = await stat(directory)
		if (!info.isDirectory() || !(info.mode & 0o222)) return false
		await access(directory, constants.W_OK | constants.X_OK)
		return true
	} catch (error) {
		if (error instanceof Error && `code` in error && error.code === `ENOENT`) {
			const parent = path.dirname(directory)
			return parent !== directory && writableDirectory(parent)
		}
		return false
	}
}

async function entryExists(file: string): Promise<boolean> {
	try {
		await lstat(file)
		return true
	} catch (error) {
		if (error instanceof Error && `code` in error && error.code === `ENOENT`)
			return false
		throw error
	}
}

/** Discover an enabled shell's search path and atomically replace one completion file. */
export async function writeCompletionFile(
	name: string,
	shell: CompletionInstallTarget,
	source: string,
): Promise<string> {
	const { preferred, directories } = await inspectShell(shell)
	const filename =
		shell === `zsh`
			? `_${name}`
			: `${name}.${shell === `nushell` ? `nu` : shell === `carapace` ? `yaml` : shell}`
	const candidates = preferred
		? directories.filter((dir) => dir === preferred)
		: directories
	let destination: string | undefined
	for (const directory of candidates) {
		if (await writableDirectory(directory)) {
			destination = directory
			break
		}
	}
	if (!destination) {
		const setting = {
			bash: `$BASH_COMPLETION_USER_DIR or $XDG_DATA_HOME`,
			zsh: `$fpath`,
			fish: `$fish_complete_path (including the user vendor directory)`,
			nushell: `$nu.vendor-autoload-dirs (including the user vendor directory)`,
			carapace: `the specs path reported by carapace --help`,
		}[shell]
		throw new Error(
			`No writable ${shell} completion directory was discovered. Check ${setting} in your shell configuration.`,
		)
	}
	// Nu executes every autoload file, so duplicate registrations in either
	// direction matter. Other shells select the first matching completion file.
	const conflicts =
		shell === `nushell`
			? directories.filter((dir) => dir !== destination)
			: directories.slice(0, directories.indexOf(destination))
	for (const directory of conflicts) {
		for (const entry of shell === `bash`
			? [filename, name, `_${name}`]
			: [filename]) {
			const existing = path.join(directory, entry)
			if (await entryExists(existing))
				throw new Error(
					shell === `nushell`
						? `Completion ${existing} is also autoloaded. Update or remove that registration first.`
						: `Completion ${existing} takes precedence over ${destination}. Update or remove that override first.`,
				)
		}
	}
	const file = path.join(destination, filename)
	// bash-completion tries the extensionless name before name.bash in each directory.
	if (shell === `bash`) {
		const existing = path.join(destination, name)
		if (await entryExists(existing))
			throw new Error(
				`Completion ${existing} takes precedence over ${file}. Update or remove that override first.`,
			)
	}
	if (await entryExists(file)) {
		if (!(await lstat(file)).isFile())
			throw new Error(
				`Cannot replace ${file}: the existing completion is not a regular file.`,
			)
	}
	await mkdir(destination, { recursive: true, mode: 0o755 })
	const temporary = await mkdtemp(path.join(destination, `.completion-`))
	try {
		const staged = path.join(temporary, filename)
		await writeFile(staged, source, { mode: 0o644 })
		await rename(staged, file)
	} finally {
		await rm(temporary, { recursive: true, force: true })
	}
	return file
}
