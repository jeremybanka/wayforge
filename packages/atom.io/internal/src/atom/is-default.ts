import { traceAllSelectorAtoms } from "../selector"
import type { Store } from "../store"
import { target } from "../transaction"

export const isAtomDefault = (key: string, store: Store): boolean => {
	const core = target(store)
	return core.atomsThatAreDefault.has(key)
}

export const markAtomAsDefault = (key: string, store: Store): void => {
	const core = target(store)
	core.atomsThatAreDefault = new Set(core.atomsThatAreDefault).add(key)
}

export const markAtomAsNotDefault = (key: string, store: Store): void => {
	const core = target(store)
	core.atomsThatAreDefault = new Set(target(store).atomsThatAreDefault)
	core.atomsThatAreDefault.delete(key)
}

export const isSelectorDefault = (key: string, store: Store): boolean => {
	const rootKeys = traceAllSelectorAtoms(key, store)
	return rootKeys.every((rootKey) => isAtomDefault(rootKey, store))
}
