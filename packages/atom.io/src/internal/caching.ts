import type { ReadableState, Transceiver } from "."
import { closeOperation, isChildStore, openOperation, Tracker } from "."
import { Future } from "./future"
import {
	evictDownstreamFromAtom,
	evictDownstreamFromSelector,
} from "./set-state/evict-downstream"
import type { Store } from "./store"

export function writeToCache<T>(
	target: Store,
	state: ReadableState<T>,
	value: T,
	// subject: Subject<StateUpdate<unknown>>,
): T
export function writeToCache<T extends Promise<any>>(
	target: Store,
	state: ReadableState<T>,
	value: T,
	// subject: Subject<StateUpdate<unknown>>,
): Future<Awaited<T>>
export function writeToCache<T>(
	target: Store,
	state: ReadableState<T>,
	value: T,
	// subject: Subject<StateUpdate<unknown>>,
): Future<T> | T {
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
						case `mutable_atom`:
							evictDownstreamFromAtom(target, state)
							break
						case `readonly_pure_selector`:
						case `writable_pure_selector`:
							evictDownstreamFromSelector(target, key)
							break
						// held selectors, by definitions, don't become promises
					}
					closeOperation(target)
					subject.next({ newValue: resolved, oldValue: future })
				}
			})
			.catch((thrown) => {
				target.logger.error(`💥`, `state`, key, `rejected:`, thrown)
			})
		return future
	}
	target.valueMap.set(key, value)
	return value
}

/**
 * @param target - the newest layer of the store
 * @param state - the state to read from cache
 * @param mut - whether the value is intended to be mutable
 * @returns the state's current value
 */
export function readFromCache<T>(
	target: Store,
	state: ReadableState<T>,
	mut: `mut` | undefined,
): T {
	target.logger.info(`📖`, state.type, state.key, `reading cached value`)
	let value = target.valueMap.get(state.key) as T

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
		const selector =
			target.writableSelectors.get(key) ?? target.readonlySelectors.get(key)
		if (selector) {
			selector.getFrom(target)
		}
		return
	}
	if (target.operation.open) {
		target.operation.prev.set(key, currentValue)
	}
	target.valueMap.delete(key)
	target.logger.info(`🗑`, `state`, key, `evicted`)
}
