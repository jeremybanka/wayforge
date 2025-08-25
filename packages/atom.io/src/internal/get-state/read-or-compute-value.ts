import type { ViewOf } from "atom.io"

import type { ReadableState } from ".."
import { readFromCache, writeToCache } from "../caching"
import { isFn } from "../is-fn"
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
	target.logger.info(`❔`, state.type, state.key, `value not found in cache`)
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
			if (isFn(state.default)) {
				def = state.default()
				target.logger.info(`✨`, state.type, key, `computed default`, def)
			} else {
				def = state.default
				target.logger.info(`✨`, state.type, key, `using static default`, def)
			}
			const cachedValue = writeToCache(target, state, def)
			return cachedValue
		}
		case `mutable_atom`: {
			const instance = new state.class()
			target.logger.info(`✨`, state.type, key, `created new instance`, instance)
			const cachedValue = writeToCache(target, state, instance)
			return cachedValue
		}
	}
}
