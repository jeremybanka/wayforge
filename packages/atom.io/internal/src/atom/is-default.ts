import { newest } from "../lineage"
import { traceAllSelectorAtoms } from "../selector"
import type { Store } from "../store"

export const isAtomDefault = (key: string, store: Store): boolean => {
	const core = newest(store)
	return core.atomsThatAreDefault.has(key)
}

export const markAtomAsDefault = (key: string, store: Store): void => {
	const core = newest(store)
	core.atomsThatAreDefault = new Set(core.atomsThatAreDefault).add(key)
}

export const markAtomAsNotDefault = (key: string, store: Store): void => {
	const core = newest(store)
	core.atomsThatAreDefault = new Set(newest(store).atomsThatAreDefault)
	core.atomsThatAreDefault.delete(key)
}
