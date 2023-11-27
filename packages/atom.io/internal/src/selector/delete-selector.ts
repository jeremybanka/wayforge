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
	core.selectorGraph.delete(key)
	store.logger.info(`🔥`, `selector`, `${key}`, `deleted`)
}
