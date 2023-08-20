import type { Atom } from "./atom"
import { isValueCached, readCachedValue } from "./caching"
import type { ReadonlySelector, Selector } from "./selector"
import type { Store } from "./store"
import { IMPLICIT } from "./store"

export const getState__INTERNAL = <T>(
	state: Atom<T> | ReadonlySelector<T> | Selector<T>,
	store: Store = IMPLICIT.STORE,
): T => {
	if (isValueCached(state.key, store)) {
		store.config.logger?.info(`>> read "${state.key}"`)
		return readCachedValue(state.key, store)
	}
	if (state.type !== `atom`) {
		store.config.logger?.info(`-> calc "${state.key}"`)
		return state.get()
	}
	store.config.logger?.error(
		`Attempted to get atom "${state.key}", which was never initialized in store "${store.config.name}".`,
	)
	return state.default
}
