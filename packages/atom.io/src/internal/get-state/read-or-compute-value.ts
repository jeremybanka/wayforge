import type { ReadableState } from ".."
import { cacheValue, readCachedValue } from "../caching"
import type { Store } from "../store"

export const readOrComputeValue = <T>(
	target: Store,
	state: ReadableState<T>,
): T => {
	if (target.valueMap.has(state.key)) {
		return readCachedValue(state, target)
	}
	switch (state.type) {
		case `readonly_held_selector`:
		case `readonly_pure_selector`:
		case `writable_held_selector`:
		case `writable_pure_selector`:
			target.logger.info(`🧮`, state.type, state.key, `computing value`)
			return state.get()
		case `atom`: {
			const def = state.default
			let defaultValue: T
			if (def instanceof Function) {
				defaultValue = def()
			} else {
				defaultValue = def
			}
			const cachedValue = cacheValue(
				target,
				state.key,
				defaultValue,
				state.subject,
			)
			target.logger.info(
				`💁`,
				`atom`,
				state.key,
				`could not find cached value; using default`,
				defaultValue,
			)
			return cachedValue
		}
		case `mutable_atom`: {
			const Ctor = state.class
			const instance = new Ctor()
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
