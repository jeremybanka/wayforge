import { styleText } from "node:util"

/** An ignored option occurrence. Parsing never logs these warnings automatically. */
export type CliWarning = {
	code: `unknown-option` | `option-not-valid-for-route`
	/** Display text with argument controls escaped; the other fields retain raw input. */
	message: string
	/** Spelling supplied, excluding inline values; grouped flags each use "-x". */
	option: string
	/** Zero-based index in argv.slice(2), or in words passed to interpretArguments. */
	index: number
	cliName: string
	/** Canonical selected route, such as "show/$name"; the root is "". */
	route: string
	/** Actual positional words, including values for variable route segments. */
	path: string[]
}

export type WarningFormatOptions = {
	/** Omit to detect stderr color support; false disables and true forces color. */
	forceColor?: boolean
}

export type LogWarningsOptions = WarningFormatOptions & {
	/** Defaults to console, whose warn method writes to stderr. */
	logger?: { warn: (message: string) => void }
}

/** Format terminal warnings as lines without a trailing newline, or "" when empty. */
export function formatWarnings(
	warnings: readonly CliWarning[],
	options: WarningFormatOptions = {},
): string {
	if (warnings.length === 0) return ``
	const label =
		options.forceColor === false
			? `Warning:`
			: styleText(`yellow`, `Warning:`, {
					stream: process.stderr,
					validateStream: options.forceColor !== true,
				})
	return warnings.map((warning) => `${label} ${warning.message}`).join(`\n`)
}

/** Log formatted warnings on demand; empty input produces no output. */
export function logWarnings(
	warnings: readonly CliWarning[],
	options: LogWarningsOptions = {},
): void {
	if (warnings.length === 0) return
	const logger = options.logger ?? console
	logger.warn(formatWarnings(warnings, options))
}
