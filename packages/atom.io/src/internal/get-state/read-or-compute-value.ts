import type { ReadableState } from ".."
import { cacheValue, readCachedValue } from "../caching"
import type { Store } from "../store"

export const readOrComputeValue = <T>(
	target: Store,
	state: ReadableState<T>,
): T => {
	if (target.valueMap.has(state.key)) {
		return readCachedValue(target, state)
	}
	switch (state.type) {
		case `readonly_held_selector`:
		case `readonly_pure_selector`:
		case `writable_held_selector`:
		case `writable_pure_selector`:
			target.logger.info(`🧮`, state.type, state.key, `computing value`)
			return state.get()
		case `atom`: {
			let def: T
			if (state.default instanceof Function) {
				def = state.default()
			} else {
				def = state.default
			}
			const cachedValue = cacheValue(target, state.key, def, state.subject)
			target.logger.info(
				`💁`,
				`atom`,
				state.key,
				`could not find cached value; using default`,
				def,
			)
			return cachedValue
		}
		case `mutable_atom`: {
			const instance = new state.class()
			const cachedValue = cacheValue(target, state.key, instance, state.subject)
			target.logger.info(
				`💁`,
				`mutable_atom`,
				state.key,
				`could not find cached value; using default`,
				instance,
			)
			return cachedValue
		}
	}
}
