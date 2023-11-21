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
		store.logger.info(
			`🔍`,
			`selector`,
			selectorKey,
			`discovers root atom "${dependency.key}"`,
		)
	} else {
		const rootKeys = traceSelectorAtoms(selectorKey, dependency.key, store)
		store.logger.info(
			`🔍`,
			`selector`,
			selectorKey,
			`discovers root atoms: [ ${rootKeys
				.map((key) => `"${key}"`)
				.join(`, `)} ]`,
		)
		for (const atomKey of rootKeys) {
			core.selectorAtoms = core.selectorAtoms.set({
				selectorKey,
				atomKey,
			})
		}
	}
}
