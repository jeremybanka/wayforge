import type { ReadonlyPureSelectorToken, WritableToken } from "atom.io"

import { newest } from "../lineage"
import type { Store } from "../store"
import { traceSelectorAtoms } from "./trace-selector-atoms"

export const updateSelectorAtoms = (
	store: Store,
	selectorType:
		| `readonly_held_selector`
		| `readonly_pure_selector`
		| `writable_held_selector`
		| `writable_pure_selector`,
	selectorKey: string,
	dependency: ReadonlyPureSelectorToken<unknown> | WritableToken<unknown>,
	covered: Set<string>,
): void => {
	const target = newest(store)
	const { type: dependencyType, key: dependencyKey } = dependency
	if (dependencyType === `atom` || dependencyType === `mutable_atom`) {
		target.selectorAtoms.set({
			selectorKey,
			atomKey: dependencyKey,
		})
		store.logger.info(
			`🔍`,
			selectorType,
			selectorKey,
			`discovers root atom "${dependencyKey}"`,
		)
	} else {
		const rootKeys = traceSelectorAtoms(dependencyKey, covered, store)
		store.logger.info(
			`🔍`,
			selectorType,
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
	covered.add(dependencyKey)
}
