import type { ReadonlySelectorToken, WritableToken } from "atom.io"

import { newest } from "../lineage"
import type { Store } from "../store"
import { traceSelectorAtoms } from "./trace-selector-atoms"

export const updateSelectorAtoms = (
	selectorKey: string,
	dependency: ReadonlySelectorToken<unknown> | WritableToken<unknown>,
	covered: Set<string>,
	store: Store,
): void => {
	const target = newest(store)
	if (dependency.type === `atom` || dependency.type === `mutable_atom`) {
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
		const rootKeys = traceSelectorAtoms(dependency.key, covered, store)
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
	covered.add(dependency.key)
}
