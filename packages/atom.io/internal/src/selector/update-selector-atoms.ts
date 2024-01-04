import type { ReadonlySelectorToken, WritableToken } from "atom.io"

import { newest } from "../lineage"
import type { Store } from "../store"
import { traceSelectorAtoms } from "./trace-selector-atoms"

export const updateSelectorAtoms = (
	selectorKey: string,
	dependency: ReadonlySelectorToken<unknown> | WritableToken<unknown>,
	store: Store,
): void => {
	const target = newest(store)
	if (dependency.type === `atom`) {
		target.selectorAtoms.set({
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
			target.selectorAtoms = target.selectorAtoms.set({
				selectorKey,
				atomKey,
			})
		}
	}
}
