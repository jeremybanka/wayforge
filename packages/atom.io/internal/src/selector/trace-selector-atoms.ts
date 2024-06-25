import type { Selector, Store } from ".."
import type { AtomKey, StateKey } from "../keys"
import { isAtomKey } from "../keys"
import { getSelectorDependencyKeys } from "./get-selector-dependency-keys"

export const traceSelectorAtoms = (
	selectorKey: string,
	directDependencyKey: StateKey<unknown>,
	covered: Set<string>,
	store: Store,
): AtomKey<unknown>[] => {
	const rootKeys: AtomKey<unknown>[] = []

	const indirectDependencyKeys = getSelectorDependencyKeys(
		directDependencyKey,
		store,
	)
	let depth = 0
	while (indirectDependencyKeys.length > 0) {
		// biome-ignore lint/style/noNonNullAssertion: just checked length ^^^
		const indirectDependencyKey = indirectDependencyKeys.shift()!
		if (covered.has(indirectDependencyKey)) {
			continue
		}
		covered.add(indirectDependencyKey)
		++depth
		if (depth > 99999) {
			throw new Error(
				`Maximum selector dependency depth exceeded (> 99999) in selector "${selectorKey}". This is likely due to a circular dependency.`,
			)
		}

		if (!isAtomKey(indirectDependencyKey, store)) {
			indirectDependencyKeys.push(
				...getSelectorDependencyKeys(indirectDependencyKey, store),
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
	const directDependencyKeys = getSelectorDependencyKeys(selectorKey, store)
	const covered = new Set<string>()
	return directDependencyKeys.flatMap((depKey) =>
		isAtomKey(depKey, store)
			? depKey
			: traceSelectorAtoms(selectorKey, depKey, covered, store),
	)
}
