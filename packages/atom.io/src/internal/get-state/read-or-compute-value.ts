import type { ViewOf } from "atom.io"

import type { ReadableState } from ".."
import { readFromCache, writeToCache } from "../caching"
import { isFn } from "../is-fn"
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
		case `readonly_pure_selector`:
		case `writable_pure_selector`: {
			let val: E | T
			target.logger.info(`🧮`, state.type, key, `computing value`)
			try {
				val = state.getFrom(target)
				if (val instanceof Promise) {
					return (val as Promise<E & T>).catch((e) => {
						target.logger.error(`💥`, state.type, key, `rejected:`, e)
						if (state.catch) {
							for (const Class of state.catch) {
								if (e instanceof Class) {
									return writeToCache(target, state, e)
								}
							}
						}
						throw e
					}) as E | T
				}
			} catch (e) {
				target.logger.error(`💥`, state.type, key, `rejected:`, e)
				if (state.catch) {
					for (const Class of state.catch) {
						if (e instanceof Class) {
							return writeToCache(target, state, e)
						}
					}
				}
				throw e
			}
			const cachedValue = writeToCache(target, state, val)
			return cachedValue
		}
		case `atom`: {
			let def: E | T
			if (isFn(state.default)) {
				try {
					def = state.default()
					if (def instanceof Promise) {
						def = (def as Promise<T> & T).catch<E | T>((thrown) => {
							target.logger.error(`💥`, state.type, key, `rejected:`, thrown)
							if (state.catch) {
								for (const Class of state.catch) {
									if (thrown instanceof Class) {
										return thrown
									}
								}
							}
							throw thrown
						}) as E | T
					}
				} catch (e) {
					target.logger.error(`💥`, state.type, key, `rejected:`, e)
					if (state.catch) {
						for (const Class of state.catch) {
							if (e instanceof Class) {
								def = writeToCache(target, state, e)
								target.logger.info(
									`✨`,
									state.type,
									key,
									`computed default`,
									def,
								)
								return def
							}
						}
					}
					throw e
				}
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
