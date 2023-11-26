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
		store.logger.info(`📖`, state.type, state.key, `reading cached value`)
		return readCachedValue(state.key, store)
	}
	if (state.type !== `atom`) {
		store.logger.info(`🧮`, state.type, state.key, `calculating value`)
		return state.get()
	}
	store.logger.info(`💁`, `atom`, state.key, `could not find cached value`)
	return state.default instanceof Function ? state.default() : state.default
}
