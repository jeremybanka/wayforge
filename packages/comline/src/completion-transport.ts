import { readdir, stat } from "node:fs/promises"
import { homedir } from "node:os"
import * as path from "node:path"

import type { CommandLineInterface } from "./cli"
import {
	complete,
	type CompletionCandidate,
	type CompletionResult,
} from "./completion"
/* eslint-disable quotes -- Import attributes require string literals. */
import bash from "./shells/completion.bash" with { type: "text" }
import fish from "./shells/completion.fish" with { type: "text" }
import zsh from "./shells/completion.zsh" with { type: "text" }
/* eslint-enable quotes */

export type CompletionShell = `bash` | `zsh` | `fish` | `nushell`
export type CompletionTargetFormat = CompletionShell | `carapace`

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

function marker(name: string, end = false): string {
	return `# ${end ? `<<<` : `>>>`} ${name} completions ${end ? `<<<` : `>>>`}`
}

/** Generate a delimited script or Carapace spec. Does not modify shell configuration. */
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
			body = { bash, zsh, fish }[target]
				.replaceAll(`NAME`, name.replaceAll(/[-.]/g, `_`))
				.replaceAll(`COMMAND`, name)
			break
		case `nushell`:
			// Capture the prior closure so this registration composes with Carapace and
			// other Comline commands. The command name is restricted before interpolation.
			body = `let comline_previous = $env.config.completions.external.completer
$env.config.completions.external.enable = true
$env.config.completions.external.completer = {|spans|
    if ($spans | is-empty) { return [] }
    if (($spans.0 | path basename) == "${name}") {
        try { ^$spans.0 _comline nushell ...($spans | skip 1) | from json } catch { [] }
    } else if $comline_previous != null {
        do $comline_previous $spans
    } else { null }
}
`
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
	// compinit requires this metadata on the first line. Setup editing treats the
	// adjacent header as part of the delimited block when replacing or removing it.
	const start =
		target === `zsh` ? `#compdef ${name}\n${marker(name)}` : marker(name)
	return `${start}\n${body.trimEnd()}\n${marker(name, true)}\n`
}

function editSetup(
	contents: string,
	name: string,
	target: CompletionTargetFormat,
	script: string,
): string {
	checkName(name)
	const normalize = (line: string): string => line.replace(/\s/g, ``)
	const start = normalize(marker(name))
	const end = normalize(marker(name, true))
	const lines = contents.match(/[^\n]*\n|[^\n]+$/g) ?? []
	const output: string[] = []
	let inside = false
	let inserted = false
	for (const line of lines) {
		const normalized = normalize(line)
		if (normalized === start) {
			if (inside)
				throw new Error(`Nested completion setup delimiter for ${name}.`)
			// The first-line Zsh registration belongs to this block as well.
			if (target === `zsh`) {
				let header = output.length - 1
				while (header >= 0 && !output[header].trim()) header--
				if (normalize(output[header] ?? ``) === `#compdef${name}`) {
					output.splice(header)
				}
			}
			inside = true
			if (!inserted) {
				output.push(script)
				inserted = true
			}
		} else if (normalized === end) {
			if (!inside)
				throw new Error(`Unmatched completion setup delimiter for ${name}.`)
			inside = false
		} else if (!inside) output.push(line)
	}
	if (inside)
		throw new Error(`Unmatched completion setup delimiter for ${name}.`)
	if (!inserted && script) {
		if (contents && !contents.endsWith(`\n`))
			output.push(contents.includes(`\r\n`) ? `\r\n` : `\n`)
		output.push(script)
	}
	return output.join(``)
}

/** Update a shell profile's setup block. Bash loads its adapter from the CLI. */
export function updateCompletionSetup(
	contents: string,
	name: string,
	target: CompletionTargetFormat,
): string {
	checkName(name)
	const script =
		target === `bash`
			? `${marker(name)}
if command -v ${name} >/dev/null 2>&1; then
    source <(${name} completion bash)
fi
${marker(name, true)}
`
			: completionScript(name, target)
	return editSetup(
		contents,
		name,
		target,
		contents.includes(`\r\n`) ? script.replaceAll(`\n`, `\r\n`) : script,
	)
}

/** Remove matching blocks while preserving all text outside their delimiters. */
export function removeCompletionSetup(
	contents: string,
	name: string,
	target: CompletionTargetFormat,
): string {
	return editSetup(contents, name, target, ``)
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
	return /[\s{}()[\]<>$&"'|;#\\`]/.test(value) ? JSON.stringify(value) : value
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
 * or undefined for normal invocation. Never parses options, loads config or exits.
 */
export async function completionResponse(
	definition: CommandLineInterface<any>,
	argv: readonly string[],
): Promise<string | undefined> {
	const [command, ...args] = argv.slice(2)
	if (command === `completion`) {
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
	if (!cobra && !carapace && !nushell) return undefined
	const words = cobra
		? args
		: carapace
			? args.slice(2)
			: args.slice(1).map(unquoteNuWord)
	const result = await complete(definition, { words })
	if (cobra) {
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
		if (
			!result.appendSpace ||
			candidates.some((candidate) => candidate.appendSpace === false)
		)
			directive |= cobraDirectives.noSpace
		if (result.context.error) directive |= cobraDirectives.error
		const lines = candidates
			// Newlines/tabs cannot be represented as candidate values in Cobra's protocol.
			.filter((candidate) => !/[\r\n\t]/.test(candidate.value))
			.map((candidate) => {
				// Cobra's scripts retain the --flag= prefix themselves.
				const description =
					command === `__completeNoDesc`
						? ``
						: (candidate.description ?? ``).replace(/[\r\n\t]+/g, ` `)
				return candidate.value + (description ? `\t${description}` : ``)
			})
		return [...lines, `:${directive}`, ``].join(`\n`)
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
