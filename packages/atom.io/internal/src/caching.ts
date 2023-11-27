import type { StateUpdate } from "atom.io"
import { Future } from "./future"
import type { Store } from "./store"
import type { Subject } from "./subject"
import { target } from "./transaction"

export function cacheValue<T>(
	key: string,
	value: T,
	subject: Subject<StateUpdate<unknown>>,
	store: Store,
): T
export function cacheValue<T extends Promise<any>>(
	key: string,
	value: T,
	subject: Subject<StateUpdate<unknown>>,
	store: Store,
): Future<T>
export function cacheValue<T>(
	key: string,
	value: T,
	subject: Subject<StateUpdate<unknown>>,
	store: Store,
): Future<T> | T {
	const currentValue = target(store).valueMap.get(key)
	if (currentValue instanceof Future) {
		currentValue.cancel()
	}
	if (value instanceof Promise) {
		const future = new Future<T>(value)
		target(store).valueMap.set(key, future)
		future
			.then((resolved) => {
				if (future.isCanceled) {
					return
				}
				cacheValue(key, resolved, subject, store)
				subject.next({ newValue: resolved, oldValue: future })
			})
			.catch((thrown) => {
				if (thrown !== `canceled`) {
					store.logger.error(`💥`, `state`, key, `rejected:`, thrown)
				}
			})
		return future
	}
	target(store).valueMap.set(key, value)
	return value
}

export const readCachedValue = <T>(key: string, store: Store): T =>
	target(store).valueMap.get(key)

export const isValueCached = (key: string, store: Store): boolean =>
	target(store).valueMap.has(key)

export const evictCachedValue = (key: string, store: Store): void => {
	const core = target(store)
	const currentValue = core.valueMap.get(key)
	if (currentValue instanceof Future) {
		currentValue.cancel()
	}
	if (core.operation.open) {
		core.operation.prev.set(key, currentValue)
	}
	core.valueMap.delete(key)
	store.logger.info(`🗑`, `state`, key, `evicted`)
}
