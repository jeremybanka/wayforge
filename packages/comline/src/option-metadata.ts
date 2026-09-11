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

export function deduplicateOptions(
	options: readonly ArgumentOption[],
): ArgumentOption[] {
	const seen = new Map<string, Set<CompletionHints[`provide`]>>()
	return options.filter((option) => {
		const hints = option.completion
		const signature = JSON.stringify([
			option.key,
			option.names,
			option.valueKind,
			option.description,
			hints?.fileSystem ?? `none`,
			hints?.appendSpace ?? true,
			hints?.repeatable ?? true,
			optionChoices(option).map((value) => {
				const item = typeof value === `string` ? { value } : value
				return [
					item.value,
					item.description ?? ``,
					item.appendSpace ?? hints?.appendSpace ?? true,
				]
			}),
		])
		let providers = seen.get(signature)
		if (!providers) {
			providers = new Set<CompletionHints[`provide`]>()
			seen.set(signature, providers)
		}
		if (providers.has(hints?.provide)) return false
		providers.add(hints?.provide)
		return true
	})
}
