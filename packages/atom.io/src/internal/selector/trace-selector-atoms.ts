import type { Selector, Store } from ".."
import type { AtomKey, StateKey } from "../keys"
import { isAtomKey } from "../keys"
import { getSelectorDependencyKeys } from "./get-selector-dependency-keys"

export const traceSelectorAtoms = (
	store: Store,
	directDependencyKey: StateKey<unknown>,
	covered: Set<string>,
): AtomKey<unknown>[] => {
	const rootKeys: AtomKey<unknown>[] = []

	const indirectDependencyKeys = getSelectorDependencyKeys(
		store,
		directDependencyKey,
	)
	while (indirectDependencyKeys.length > 0) {
		// biome-ignore lint/style/noNonNullAssertion: just checked length ^^^
		const indirectDependencyKey = indirectDependencyKeys.shift()!
		if (covered.has(indirectDependencyKey)) {
			continue
		}
		covered.add(indirectDependencyKey)

		if (!isAtomKey(store, indirectDependencyKey)) {
			indirectDependencyKeys.push(
				...getSelectorDependencyKeys(store, indirectDependencyKey),
			)
		} else if (!rootKeys.includes(indirectDependencyKey)) {
			rootKeys.push(indirectDependencyKey)
		}
	}

	return rootKeys
}

export const traceAllSelectorAtoms = (
	selector: Selector<any>,
	store: Store,
): AtomKey<unknown>[] => {
	const selectorKey = selector.key
	const directDependencyKeys = getSelectorDependencyKeys(store, selectorKey)
	const covered = new Set<string>()
	return directDependencyKeys.flatMap((depKey) =>
		isAtomKey(store, depKey)
			? depKey
			: traceSelectorAtoms(store, depKey, covered),
	)
}
