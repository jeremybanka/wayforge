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
import zsh from "./shells/discover-completions.zsh" with { type: "text" }
/* eslint-enable quotes */

export type CompletionInstallShell = `bash` | `zsh` | `fish`

const execute = promisify(execFile)

async function inspectShell(shell: CompletionInstallShell): Promise<{
	preferred: string
	directories: string[]
}> {
	let stdout: string
	try {
		// Interactive startup reads the user's actual completion settings. Never
		// interpolate command names or paths into shell code. Startup may print text,
		// so frame our response with NULs, which cannot occur in filesystem paths.
		const result = await execute(
			shell,
			[`-i`, `-c`, { bash, zsh, fish }[shell]],
			{
				timeout: 10_000,
				maxBuffer: 1024 * 1024,
				env: { ...process.env, TERM: process.env[`TERM`] ?? `dumb` },
			},
		)
		stdout = result.stdout
	} catch (cause) {
		throw new Error(
			`Could not inspect ${shell} completion settings. Check that ${shell} is installed and starts without errors or prompts.`,
			{ cause },
		)
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
	shell: CompletionInstallShell,
	source: string,
): Promise<string> {
	const { preferred, directories } = await inspectShell(shell)
	const filename = shell === `zsh` ? `_${name}` : `${name}.${shell}`
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
		const setting =
			shell === `zsh`
				? `$fpath`
				: shell === `fish`
					? `$fish_complete_path (including the user vendor directory)`
					: `$BASH_COMPLETION_USER_DIR or $XDG_DATA_HOME`
		throw new Error(
			`No writable ${shell} completion directory was discovered. Check ${setting} in your shell configuration.`,
		)
	}
	// Do not report success for a file hidden by an earlier user override.
	for (const directory of directories.slice(
		0,
		directories.indexOf(destination),
	)) {
		for (const entry of shell === `bash`
			? [filename, name, `_${name}`]
			: [filename]) {
			const existing = path.join(directory, entry)
			if (await entryExists(existing))
				throw new Error(
					`Completion ${existing} takes precedence over ${destination}. Update or remove that override first.`,
				)
		}
	}
	const file = path.join(destination, filename)
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
