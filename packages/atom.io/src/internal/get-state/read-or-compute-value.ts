import type { ReadableState } from ".."
import { readCachedValue } from "../caching"
import type { Store } from "../store"

export const readOrComputeValue = <T>(
	target: Store,
	state: ReadableState<T>,
): T => {
	if (target.valueMap.has(state.key)) {
		target.logger.info(`📖`, state.type, state.key, `reading cached value`)
		return readCachedValue(state, target)
	}
	switch (state.type) {
		case `readonly_held_selector`:
		case `readonly_pure_selector`:
		case `writable_held_selector`:
		case `writable_pure_selector`:
			target.logger.info(`🧮`, state.type, state.key, `computing value`)
			return state.get()
		case `atom`:
		case `mutable_atom`: {
			const def = state.default
			let fallback: T
			if (def instanceof Function) {
				fallback = def()
			} else {
				fallback = def
			}
			target.logger.info(
				`💁`,
				`atom`,
				state.key,
				`could not find cached value; using default`,
				fallback,
			)
			return fallback
		}
	}
}
