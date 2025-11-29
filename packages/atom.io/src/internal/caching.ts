import { Future } from "./future"
import { Tracker, type Transceiver } from "./mutable"
import { closeOperation, openOperation } from "./operation"
import {
	evictDownstreamFromAtom,
	evictDownstreamFromSelector,
} from "./set-state/evict-downstream"
import type { ReadableState } from "./state-types"
import type { Store } from "./store"
import { isChildStore } from "./transaction"

export function writeToCache<T, E>(
	target: Store,
	state: ReadableState<T, E>,
	value: E | T,
): E | T
export function writeToCache<T extends Promise<any>, E>(
	target: Store,
	state: ReadableState<T, E>,
	value: T,
): Future<Awaited<E | T>>
export function writeToCache<T, E>(
	target: Store,
	state: ReadableState<T, E>,
	value: E | T,
): E | Future<E | T> | T {
	const { key, subject, type } = state
	const currentValue = target.valueMap.get(key)
	if (currentValue instanceof Future && !currentValue.done) {
		const future = currentValue
		if (value instanceof Promise) {
			future.use(value)
			return future
		}
		target.valueMap.set(key, value)
		return value
	}
	if (value instanceof Promise) {
		const future = new Future<T>(value)
		target.valueMap.set(key, future)
		future
			.then(function handleResolvedFuture(resolved) {
				const current = target.valueMap.get(key)
				if (current === future) {
					openOperation(target, state)
					writeToCache(target, state, resolved)
					// eslint-disable-next-line @typescript-eslint/switch-exhaustiveness-check
					switch (type) {
						case `atom`:
							evictDownstreamFromAtom(target, state)
							break
						case `readonly_pure_selector`:
						case `writable_pure_selector`:
							evictDownstreamFromSelector(target, key)
							break
						// held selectors, by definition, don't become promises
					}
					closeOperation(target)
					subject.next({ newValue: resolved, oldValue: future })
				}
			})
			.catch((thrown) => {
				target.logger.error(`💥`, state.type, key, `rejected:`, thrown)
			})
		return future
	}
	target.logger.info(`📝`, state.type, state.key, `writing to cache`, value)
	target.valueMap.set(key, value)
	return value
}

/**
 * @param target - the newest layer of the store
 * @param state - the state to read from cache
 * @param mut - whether the value is intended to be mutable
 * @returns the state's current value
 */
export function readFromCache<T, E>(
	target: Store,
	state: ReadableState<T, E>,
	mut: `mut` | undefined,
): E | T {
	target.logger.info(`📖`, state.type, state.key, `reading cached value`)
	let value = target.valueMap.get(state.key) as E | T

	const mayNeedToBeCopied =
		mut === `mut` && state.type === `mutable_atom` && isChildStore(target)
	if (mayNeedToBeCopied) {
		const mutableAtom = state
		const { parent } = target

		if (target.valueMap.hasOwn(mutableAtom.key)) {
			return value
		}

		const parentValue = parent.valueMap.get(mutableAtom.key) as T &
			Transceiver<any, any, any>

		target.logger.info(`📃`, `atom`, mutableAtom.key, `copying`)
		const jsonValue = parentValue.toJSON()
		const copiedValue = mutableAtom.class.fromJSON(jsonValue)
		target.valueMap.set(mutableAtom.key, copiedValue)
		new Tracker(mutableAtom, parent)
		value = copiedValue
	}
	return value
}

export function evictCachedValue(target: Store, key: string): void {
	const currentValue = target.valueMap.get(key)
	if (currentValue instanceof Future) {
		return
	}
	if (target.operation.open) {
		target.operation.prev.set(key, currentValue)
	}
	target.valueMap.delete(key)
	target.logger.info(`🗑`, `state`, key, `evicted`)
}
