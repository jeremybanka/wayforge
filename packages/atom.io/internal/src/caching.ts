import type { StateUpdate } from "atom.io"
import { Future } from "./future"
import type { Store } from "./store"
import { IMPLICIT } from "./store"
import type { Subject } from "./subject"
import { target } from "./transaction"

export const cacheValue = (
	key: string,
	value: unknown,
	subject: Subject<StateUpdate<unknown>>,
	store: Store = IMPLICIT.STORE,
): void => {
	const currentValue = target(store).valueMap.get(key)
	if (currentValue instanceof Future) {
		currentValue.cancel()
	}
	if (value instanceof Promise) {
		const future = new Future(value)
		target(store).valueMap.set(key, future)
		future
			.then((value) => {
				if (future.isCanceled) {
					return
				}
				cacheValue(key, value, subject, store)
				subject.next({ newValue: value, oldValue: value })
			})
			.catch((thrown) => {
				if (thrown !== `canceled`) {
					store.logger.error(`💥`, `state`, key, `rejected:`, thrown)
				}
			})
	} else {
		target(store).valueMap.set(key, value)
	}
}

export const readCachedValue = <T>(
	key: string,
	store: Store = IMPLICIT.STORE,
): T => target(store).valueMap.get(key)

export const isValueCached = (
	key: string,
	store: Store = IMPLICIT.STORE,
): boolean => target(store).valueMap.has(key)

export const evictCachedValue = (
	key: string,
	store: Store = IMPLICIT.STORE,
): void => {
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
