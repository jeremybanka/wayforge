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
	const covered = new Set<string>()
	if (dependency.type === `atom` || dependency.type === `mutable_atom`) {
		covered.add(dependency.key)
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
		const rootKeys = traceSelectorAtoms(
			selectorKey,
			dependency.key,
			covered,
			store,
		)
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
