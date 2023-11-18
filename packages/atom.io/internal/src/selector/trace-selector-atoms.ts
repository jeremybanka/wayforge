import type { Store } from ".."
import type { AtomKey, StateKey} from "../keys";
import { isAtomKey } from "../keys"
import { getSelectorDependencyKeys } from "./get-selector-dependency-keys"

export const traceSelectorAtoms = (
	selectorKey: string,
	directDependencyKey: StateKey<unknown>,
	store: Store,
): AtomKey<unknown>[] => {
	const roots: AtomKey<unknown>[] = []

	const indirectDependencyKeys = getSelectorDependencyKeys(directDependencyKey, store)
	let depth = 0
	while (indirectDependencyKeys.length > 0) {
		// biome-ignore lint/style/noNonNullAssertion: just checked length ^^^
		const indirectDependencyKey = indirectDependencyKeys.shift()!
		++depth
		if (depth > 999) {
			store.config.logger?.warn(
				`Maximum selector dependency depth exceeded 999 in selector "${selectorKey}".`,
			)
		}
		if (depth > 99999) {
			throw new Error(
				`Maximum selector dependency depth exceeded in selector "${selectorKey}".`,
			)
		}

		if (!isAtomKey(indirectDependencyKey, store)) {
			indirectDependencyKeys.push(...getSelectorDependencyKeys(indirectDependencyKey, store))
		} else {
			roots.push(indirectDependencyKey)
		}
	}

	return roots
}

export const traceAllSelectorAtoms = (
	selectorKey: string,
	store: Store,
): AtomKey<unknown>[] => {
	const directDependencyKeys = getSelectorDependencyKeys(selectorKey, store)
	return directDependencyKeys.flatMap((depKey) =>
		isAtomKey(depKey, store)
			? depKey
			: traceSelectorAtoms(selectorKey, depKey, store),
	)
}
