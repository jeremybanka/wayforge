import type { ViewOf } from "atom.io"

import { readFromCache, writeToCache } from "../caching"
import { safeCompute } from "../safe-compute"
import type { ReadableState } from "../state-types"
import type { Store } from "../store"

export function readOrComputeValue<T, E>(
	target: Store,
	state: ReadableState<T, E>,
	mut?: undefined,
): ViewOf<E | T>
export function readOrComputeValue<T, E>(
	target: Store,
	state: ReadableState<T, E>,
	mut: `mut`,
): E | T
export function readOrComputeValue<T, E>(
	target: Store,
	state: ReadableState<T, E>,
	mut: `mut` | undefined,
): E | T {
	if (target.valueMap.has(state.key)) {
		return readFromCache(target, state, mut)
	}
	target.logger.info(`❔`, state.type, state.key, `value not found in cache`)
	const { key } = state
	switch (state.type) {
		case `readonly_held_selector`:
		case `writable_held_selector`:
			target.logger.info(`🧮`, state.type, key, `computing value`)
			return state.getFrom(target)
		case `writable_pure_selector`:
		case `readonly_pure_selector`:
		case `atom`:
			return safeCompute(target, state)
		case `mutable_atom`: {
			const instance = new state.class()
			target.logger.info(`✨`, state.type, key, `created new instance`, instance)
			const cachedValue = writeToCache(target, state, instance)
			return cachedValue
		}
	}
}
