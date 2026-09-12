import type { ArgumentOption } from "./arguments"
import type { CompletionCandidate, CompletionHints } from "./completion"

// Completion equivalence includes all observable metadata and provider identity.
// Argument scanning has a narrower cache key because hints cannot affect consumption.
export function optionChoices(
	option: ArgumentOption,
): readonly (string | CompletionCandidate)[] {
	return (
		option.completion?.choices ??
		(option.choices.length
			? option.choices
			: option.valueKind === `boolean`
				? [`true`, `false`, `0`, `1`]
				: [])
	)
}

// Required fields make additions to any of these public metadata types a compile
// error until normalization handles them. Route identity is not presentation
// equivalence. Choices are resolved once; providers
// are intentionally excluded from JSON and compared by function identity below.
type NormalizedOptionMetadata = Required<
	Omit<ArgumentOption, `id` | `choices` | `completion`>
> & {
	choices: readonly Required<CompletionCandidate>[]
	completion: Required<Omit<CompletionHints, `choices` | `provide`>>
}

function normalizeOptionMetadata(
	option: ArgumentOption,
): NormalizedOptionMetadata {
	const hints = option.completion
	return {
		key: option.key,
		names: option.names,
		valueKind: option.valueKind,
		description: option.description,
		choices: optionChoices(option).map(
			(value): Required<CompletionCandidate> => {
				const item = typeof value === `string` ? { value } : value
				return {
					value: item.value,
					description: item.description ?? ``,
					appendSpace: item.appendSpace ?? hints?.appendSpace ?? true,
				}
			},
		),
		completion: {
			fileSystem: hints?.fileSystem ?? `none`,
			appendSpace: hints?.appendSpace ?? true,
			repeatable: hints?.repeatable ?? true,
		},
	}
}

export function deduplicateOptions(
	options: readonly ArgumentOption[],
): ArgumentOption[] {
	const seen = new Map<string, Set<CompletionHints[`provide`]>>()
	return options.filter((option) => {
		const provide = option.completion?.provide
		const signature = JSON.stringify(normalizeOptionMetadata(option))
		let providers = seen.get(signature)
		if (!providers) {
			providers = new Set<CompletionHints[`provide`]>()
			seen.set(signature, providers)
		}
		if (providers.has(provide)) return false
		providers.add(provide)
		return true
	})
}
