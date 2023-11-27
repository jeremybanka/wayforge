import type { Atom } from "./atom"
import { isValueCached, readCachedValue } from "./caching"
import type { ReadonlySelector, Selector } from "./selector"
import type { Store } from "./store"

export const readOrComputeValue = <T>(
	state: Atom<T> | ReadonlySelector<T> | Selector<T>,
	store: Store,
): T => {
	if (isValueCached(state.key, store)) {
		store.logger.info(`📖`, state.type, state.key, `reading cached value`)
		return readCachedValue(state.key, store)
	}
	if (state.type !== `atom`) {
		store.logger.info(`🧮`, state.type, state.key, `computing value`)
		return state.get()
	}
	const fallback =
		state.default instanceof Function ? state.default() : state.default
	store.logger.info(
		`💁`,
		`atom`,
		state.key,
		`could not find cached value; using default`,
		fallback,
	)
	return state.default instanceof Function ? state.default() : state.default
}
