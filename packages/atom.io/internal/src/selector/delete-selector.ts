import type { ReadonlySelectorToken, WritableSelectorToken } from "atom.io"

import type { Store } from ".."
import { newest } from ".."

export function disposeSelector(
	selectorToken: ReadonlySelectorToken<unknown> | WritableSelectorToken<unknown>,
	store: Store,
): void {
	const target = newest(store)
	const { key } = selectorToken
	switch (selectorToken.type) {
		case `selector`:
			target.selectors.delete(key)
			break
		case `readonly_selector`:
			target.readonlySelectors.delete(key)
			break
	}
	target.valueMap.delete(key)
	target.selectorAtoms.delete(key)
	const downstreamTokens = target.selectorGraph
		.getRelationEntries({ upstreamSelectorKey: key })
		.filter(([_, { source }]) => source === key)
		.map(
			([downstreamSelectorKey]) =>
				target.selectors.get(downstreamSelectorKey) ??
				target.readonlySelectors.get(downstreamSelectorKey),
		)
	for (const downstreamToken of downstreamTokens) {
		if (downstreamToken) {
			disposeSelector(downstreamToken, store)
		}
	}
	target.selectorGraph.delete(key)
	store.logger.info(`🔥`, selectorToken.type, key, `deleted`)
}
