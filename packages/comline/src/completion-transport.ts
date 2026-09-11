import { readdir, stat } from "node:fs/promises"
import { homedir } from "node:os"
import * as path from "node:path"

import type { CommandLineInterface } from "./cli"
import {
	type CompletionInstallTarget,
	writeCompletionFile,
} from "./completion-installation"

export type { CompletionInstallTarget } from "./completion-installation"
import {
	complete,
	type CompletionCandidate,
	type CompletionResult,
} from "./completion"
/* eslint-disable quotes -- Import attributes require string literals. */
import bash from "./shells/completion.bash" with { type: "text" }
import fish from "./shells/completion.fish" with { type: "text" }
import nu from "./shells/completion.nu" with { type: "text" }
import zsh from "./shells/completion.zsh" with { type: "text" }
/* eslint-enable quotes */

export type CompletionShell = `bash` | `zsh` | `fish` | `nushell`
export type CompletionTargetFormat = CompletionInstallTarget

// Cobra's ShellCompDirective wire values; verify against the upstream oracle.
const cobraDirectives = {
	error: 1,
	noSpace: 2,
	noFileCompletion: 4,
	filterDirectories: 16,
}

function isCompletionTarget(
	value: string | undefined,
): value is CompletionTargetFormat {
	return (
		value === `bash` ||
		value === `zsh` ||
		value === `fish` ||
		value === `nushell` ||
		value === `carapace`
	)
}

function checkName(name: string): void {
	if (!/^[a-zA-Z0-9][a-zA-Z0-9_.-]*$/.test(name)) {
		throw new Error(
			`Completion command name must contain only letters, digits, _, . or -.`,
		)
	}
}

/** Generate a standalone completion file without modifying shell configuration. */
export function completionScript(
	name: string,
	target: CompletionTargetFormat,
): string {
	checkName(name)
	let body: string
	switch (target) {
		case `bash`:
		case `zsh`:
		case `fish`:
		case `nushell`:
			body = { bash, zsh, fish, nushell: nu }[target]
				.replaceAll(`NAME`, name.replaceAll(/[-.]/g, `_`))
				.replaceAll(`COMMAND`, name)
			break
		case `carapace`:
			body = `name: ${JSON.stringify(name)}
description: Completions for ${name}
parsing: disabled
completion:
  positionalany: ["$carapace.bridge.Carapace([${name}])"]
`
			break
		default:
			throw new Error(`Unsupported completion target: ${String(target)}`)
	}
	// Zsh discovers standalone functions by their first-line metadata.
	return (target === `zsh` ? `#compdef ${name}\n` : ``) + body.trimEnd() + `\n`
}

/** Install a completion file in an enabled shell's discovered search path. */
export async function installCompletion(
	name: string,
	target: CompletionInstallTarget,
): Promise<string> {
	if (!isCompletionTarget(target))
		throw new Error(
			`Completion installation supports bash, zsh, fish, nushell, and carapace.`,
		)
	return writeCompletionFile(name, target, completionScript(name, target))
}

function replacementValue(
	result: CompletionResult,
	words: readonly string[],
	value: string,
): string {
	const { word, start, end } = result.context.replacement
	const current = words[word] ?? ``
	return current.slice(0, start) + value + current.slice(end)
}

/** Filesystem work belongs to the adapter; the shell-neutral engine remains pure. */
async function filesystemCandidates(
	result: CompletionResult,
): Promise<CompletionCandidate[]> {
	if (result.fileSystem === `none`) return []
	const prefix = result.context.prefix
	const slash = prefix.lastIndexOf(`/`)
	const directory = prefix.slice(0, slash + 1)
	const partial = prefix.slice(slash + 1)
	const expanded = directory.startsWith(`~/`)
		? path.join(homedir(), directory.slice(2))
		: directory || `.`
	try {
		const entries = await readdir(expanded, { withFileTypes: true })
		const candidates = await Promise.all(
			entries.map(async (entry) => {
				if (
					!entry.name.startsWith(partial) ||
					(entry.name.startsWith(`.`) && !partial.startsWith(`.`))
				)
					return undefined
				let isDirectory = entry.isDirectory()
				if (entry.isSymbolicLink()) {
					try {
						isDirectory = (
							await stat(path.join(expanded, entry.name))
						).isDirectory()
					} catch {
						return undefined
					}
				}
				if (result.fileSystem === `directories` && !isDirectory) return undefined
				return {
					value: directory + entry.name + (isDirectory ? `/` : ``),
					appendSpace: !isDirectory && result.appendSpace,
				}
			}),
		)
		return candidates.filter((candidate) => candidate !== undefined)
	} catch {
		return []
	}
}

function quoteNu(value: string): string {
	return /[\s*?{}()[\]<>$&"'|;#\\`]/.test(value) ? JSON.stringify(value) : value
}

function unquoteNuWord(word: string): string {
	const start = word.startsWith(`-`) ? word.indexOf(`=`) + 1 : 0
	const value = word.slice(start)
	const quote = value[0]
	if (
		(quote === `'` || quote === `\``) &&
		value.endsWith(quote) &&
		value.length > 1
	) {
		return word.slice(0, start) + value.slice(1, -1)
	}
	if (quote === `"`) {
		try {
			const parsed: unknown = JSON.parse(value)
			if (typeof parsed === `string`) return word.slice(0, start) + parsed
		} catch {
			/* Incomplete or non-JSON Nu syntax remains an unmatched prefix. */
		}
	}
	return word
}

/**
 * Handle an opt-in completion invocation using full process.argv. Returns stdout,
 * or undefined for normal invocation. Only explicit installation writes files or queries shell startup settings; never parses application options or exits.
 */
export async function completionResponse(
	definition: CommandLineInterface<any>,
	argv: readonly string[],
): Promise<string | undefined> {
	const [command, ...args] = argv.slice(2)
	if (command === `completion`) {
		if (args[0] === `install`) {
			const shell = args[1]
			if (args.length !== 2 || !isCompletionTarget(shell))
				throw new Error(
					`Usage: ${definition.cliName} completion install <bash|zsh|fish|nushell|carapace>`,
				)
			return `Installed completions at ${await installCompletion(definition.cliName, shell)}\n`
		}
		const [target, ...extra] = args
		if (extra.length || !isCompletionTarget(target)) {
			throw new Error(
				`Usage: ${definition.cliName} completion <bash|zsh|fish|nushell|carapace>`,
			)
		}
		return completionScript(definition.cliName, target)
	}
	const cobra = command === `__complete` || command === `__completeNoDesc`
	const carapace = command === `_carapace` && args[0] === `export`
	const nushell = command === `_comline` && args[0] === `nushell`
	const shell = command === `_comline` && args[0] === `complete`
	if (!cobra && !carapace && !nushell && !shell) return undefined
	const words = cobra
		? args
		: carapace
			? args.slice(2)
			: nushell
				? args.slice(1).map(unquoteNuWord)
				: args.slice(1)
	const result = await complete(definition, { words })
	if (cobra || shell) {
		// Cobra directives apply to the entire response, not to individual candidates.
		let directive =
			result.fileSystem === `none`
				? cobraDirectives.noFileCompletion
				: result.fileSystem === `directories`
					? cobraDirectives.filterDirectories
					: 0
		let candidates = result.candidates
		if (candidates.length && result.fileSystem !== `none`) {
			candidates = [...candidates, ...(await filesystemCandidates(result))]
			directive = cobraDirectives.noFileCompletion
		}
		// Unrepresentable values are not emitted and must not affect spacing.
		candidates = candidates.filter(
			(candidate) => !/[\r\n\t]/.test(candidate.value),
		)
		if (
			candidates.length
				? candidates.some(
						(candidate) => !(candidate.appendSpace ?? result.appendSpace),
					)
				: !result.appendSpace
		)
			directive |= cobraDirectives.noSpace
		if (result.context.error) directive |= cobraDirectives.error
		const lines = candidates.map((candidate) => {
			// Cobra's scripts retain the --flag= prefix themselves.
			const description =
				command === `__completeNoDesc`
					? ``
					: (candidate.description ?? ``).replace(/[\r\n\t]+/g, ` `)
			return candidate.value + (description ? `\t${description}` : ``)
		})
		const response = [...lines, `:${directive}`, ``].join(`\n`)
		if (!shell) return response
		// Owned adapters need the engine's replacement boundary; Cobra's standard
		// protocol does not carry it. Send the literal prefix rather than a JS UTF-16
		// offset, since shells count characters differently. Keep Cobra endpoints intact.
		const { word, start } = result.context.replacement
		const prefix = (words[word] ?? ``).slice(0, start)
		if (/[\r\n\t]/.test(prefix))
			return `prefix:\n:${cobraDirectives.error | cobraDirectives.noFileCompletion}\n`
		return `prefix:${prefix}\n${response}`
	}
	const candidates = [
		...result.candidates,
		...(await filesystemCandidates(result)),
	]
	const values = candidates.map((candidate) => ({
		value: replacementValue(result, words, candidate.value),
		display: candidate.value,
		description: candidate.description ?? ``,
		appendSpace: candidate.appendSpace ?? result.appendSpace,
	}))
	if (nushell) {
		return (
			JSON.stringify(
				values.map(({ value, display, description, appendSpace }) => ({
					value: quoteNu(value) + (appendSpace ? ` ` : ``),
					display,
					description,
				})),
			) + `\n`
		)
	}
	return (
		JSON.stringify({
			// Carapace uses suffix-based spacing for the response as a whole. Suppress
			// spaces conservatively if any candidate needs more input.
			nospace: values.some((value) => !value.appendSpace) ? `*` : ``,
			messages: result.diagnostics,
			values: values.map(({ appendSpace: _appendSpace, ...value }) => value),
		}) + `\n`
	)
}
