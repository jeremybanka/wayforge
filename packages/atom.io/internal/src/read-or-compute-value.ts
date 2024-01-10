import type { ReadableState } from "."
import { readCachedValue } from "./caching"
import type { Store } from "./store"

export const readOrComputeValue = <T>(
	state: ReadableState<T>,
	target: Store,
): T => {
	if (target.valueMap.has(state.key)) {
		target.logger.info(`📖`, state.type, state.key, `reading cached value`)
		return readCachedValue(state, target)
	}
	if (state.type !== `atom` && state.type !== `mutable_atom`) {
		target.logger.info(`🧮`, state.type, state.key, `computing value`)
		return state.get()
	}
	const fallback =
		state.default instanceof Function ? state.default() : state.default
	target.logger.info(
		`💁`,
		`atom`,
		state.key,
		`could not find cached value; using default`,
		fallback,
	)
	return state.default instanceof Function ? state.default() : state.default
}
