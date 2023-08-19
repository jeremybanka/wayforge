import type { Store } from ".."
import { target, IMPLICIT, traceAllSelectorAtoms } from ".."

export const isAtomDefault = (
	key: string,
	store: Store = IMPLICIT.STORE,
): boolean => {
	const core = target(store)
	return core.atomsThatAreDefault.has(key)
}

export const markAtomAsDefault = (
	key: string,
	store: Store = IMPLICIT.STORE,
): void => {
	const core = target(store)
	core.atomsThatAreDefault = new Set(core.atomsThatAreDefault).add(key)
}

export const markAtomAsNotDefault = (
	key: string,
	store: Store = IMPLICIT.STORE,
): void => {
	const core = target(store)
	core.atomsThatAreDefault = new Set(target(store).atomsThatAreDefault)
	core.atomsThatAreDefault.delete(key)
}

export const isSelectorDefault = (
	key: string,
	store: Store = IMPLICIT.STORE,
): boolean => {
	const roots = traceAllSelectorAtoms(key, store)
	return roots.every((root) => isAtomDefault(root.key, store))
}
