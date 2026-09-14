import type { CliWarning, CompletionResult } from "../../src/cli"

// Project extensible records onto the fields that define behavior. Keep closed
// option maps and argument occurrences exact, but allow additive metadata.
export function inputValues<
	T extends {
		case: string
		path: readonly string[]
		opts: unknown
	},
>(inputs: T): Pick<T, `case` | `path` | `opts`> {
	return { case: inputs.case, path: inputs.path, opts: inputs.opts }
}

export function optionOccurrences(
	options: readonly {
		key: string
		index: number
		value: string
		valueIndex?: number | undefined
	}[],
): {
	key: string
	index: number
	value: string
	valueIndex?: number | undefined
}[] {
	return options.map(({ key, index, value, valueIndex }) => ({
		key,
		index,
		value,
		valueIndex,
	}))
}

// Completion ranking is presentation; membership and effective spacing matter.
export function candidateValues<T extends { value: string }>(
	candidates: readonly T[],
): string[] {
	return candidates.map(({ value }) => value).toSorted()
}

export function candidateSpacing(
	result: Pick<CompletionResult, `candidates` | `appendSpace`>,
): { value: string; appendSpace: boolean }[] {
	return result.candidates
		.map(({ value, appendSpace }) => ({
			value,
			appendSpace: appendSpace ?? result.appendSpace,
		}))
		.toSorted((left, right) => left.value.localeCompare(right.value))
}

export function warningContext(
	warnings: readonly CliWarning[],
): Omit<CliWarning, `message`>[] {
	return warnings.map(({ code, option, index, cliName, route, path }) => ({
		code,
		option,
		index,
		cliName,
		route,
		path,
	}))
}
