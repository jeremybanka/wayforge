import type { ReadonlySelectorToken, StateToken } from "atom.io"

import type { Store } from "../store"
import { target } from "../transaction"
import { traceSelectorAtoms } from "./trace-selector-atoms"

export const updateSelectorAtoms = (
	selectorKey: string,
	dependency: ReadonlySelectorToken<unknown> | StateToken<unknown>,
	store: Store,
): void => {
	const core = target(store)
	if (dependency.type === `atom`) {
		core.selectorAtoms = core.selectorAtoms.set({
			selectorKey,
			atomKey: dependency.key,
		})
		store.config.logger?.info(
			`   || adding root for "${selectorKey}": ${dependency.key}`,
		)
		return
	}
	const rootKeys = traceSelectorAtoms(selectorKey, dependency.key, store)
	store.config.logger?.info(
		`   || adding roots for "${selectorKey}":`,
		rootKeys.map((r) => r),
	)
	for (const atomKey of rootKeys) {
		core.selectorAtoms = core.selectorAtoms.set({
			selectorKey,
			atomKey,
		})
	}
}
