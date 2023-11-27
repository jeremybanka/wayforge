import type { ReadonlySelectorToken, SelectorToken } from "atom.io"

import type { Store } from ".."
import { target } from ".."

export function deleteSelector(
	selectorToken: ReadonlySelectorToken<unknown> | SelectorToken<unknown>,
	store: Store,
): void {
	const core = target(store)
	const { key } = selectorToken
	switch (selectorToken.type) {
		case `selector`:
			core.selectors.delete(key)
			break
		case `readonly_selector`:
			core.readonlySelectors.delete(key)
			break
	}
	core.valueMap.delete(key)
	core.selectorAtoms.delete(key)
	const downstreamTokens = core.selectorGraph
		.getRelationEntries({ upstreamSelectorKey: key })
		.filter(([_, { source }]) => source === key)
		.map(
			([downstreamSelectorKey]) =>
				core.selectors.get(downstreamSelectorKey) ??
				core.readonlySelectors.get(downstreamSelectorKey),
		)
	for (const downstreamToken of downstreamTokens) {
		if (downstreamToken) {
			deleteSelector(downstreamToken, store)
		}
	}
	core.selectorGraph.delete(key)
	store.logger.info(`🔥`, selectorToken.type, `${key}`, `deleted`)
}
