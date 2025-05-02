import { newest } from "../lineage"
import type { Store } from "../store"

export const isAtomDefault = (store: Store, key: string): boolean => {
	const core = newest(store)
	return core.atomsThatAreDefault.has(key)
}

export const markAtomAsDefault = (store: Store, key: string): void => {
	const core = newest(store)
	core.atomsThatAreDefault = new Set(core.atomsThatAreDefault).add(key)
}

export const markAtomAsNotDefault = (store: Store, key: string): void => {
	const core = newest(store)
	core.atomsThatAreDefault = new Set(newest(store).atomsThatAreDefault)
	core.atomsThatAreDefault.delete(key)
}
