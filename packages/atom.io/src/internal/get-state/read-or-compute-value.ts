import type { ViewOf } from "atom.io"

import type { ReadableState } from ".."
import { readFromCache, writeToCache } from "../caching"
import type { Store } from "../store"

export function readOrComputeValue<T>(
	target: Store,
	state: ReadableState<T>,
	mut?: undefined,
): ViewOf<T>
export function readOrComputeValue<T>(
	target: Store,
	state: ReadableState<T>,
	mut: `mut`,
): T
export function readOrComputeValue<T>(
	target: Store,
	state: ReadableState<T>,
	mut: `mut` | undefined,
): T {
	if (target.valueMap.has(state.key)) {
		return readFromCache(target, state, mut)
	}
	const { key } = state
	switch (state.type) {
		case `readonly_held_selector`:
		case `readonly_pure_selector`:
		case `writable_held_selector`:
		case `writable_pure_selector`:
			target.logger.info(`🧮`, state.type, key, `computing value`)
			return state.getFrom(target)
		case `atom`: {
			let def: T
			if (state.default instanceof Function) {
				def = state.default()
			} else {
				def = state.default
			}
			const cachedValue = writeToCache(target, state, def)
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
			const cachedValue = writeToCache(target, state, instance)
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
