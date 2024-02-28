import type { StateUpdate } from "atom.io"
import { type ReadableState, isChildStore } from "."
import { Future } from "./future"
import { copyMutableIfNeeded } from "./set-state/copy-mutable-if-needed"
import type { Store } from "./store"
import type { Subject } from "./subject"

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
	target: Store,
): Future<T> | T {
	const currentValue = target.valueMap.get(key)
	if (currentValue instanceof Future) {
		currentValue.cancel()
	}
	if (value instanceof Promise) {
		const future = new Future<T>(value)
		target.valueMap.set(key, future)
		future
			.then((resolved) => {
				if (future.isCanceled) {
					return
				}
				cacheValue(key, resolved, subject, target)
				subject.next({ newValue: resolved, oldValue: future })
			})
			.catch((thrown) => {
				if (thrown !== `canceled`) {
					target.logger.error(`💥`, `state`, key, `rejected:`, thrown)
				}
			})
		return future
	}
	target.valueMap.set(key, value)
	return value
}

export const readCachedValue = <T>(
	token: ReadableState<any>,
	target: Store,
): T => {
	let value = target.valueMap.get(token.key) as T
	if (token.type === `mutable_atom` && isChildStore(target)) {
		const { parent } = target
		const copiedValue = copyMutableIfNeeded(token, parent, target)
		value = copiedValue
	}
	return value
}

export const evictCachedValue = (key: string, target: Store): void => {
	const currentValue = target.valueMap.get(key)
	if (currentValue instanceof Future) {
		currentValue.cancel()
	}
	if (target.operation.open) {
		target.operation.prev.set(key, currentValue)
	}
	target.valueMap.delete(key)
	target.logger.info(`🗑`, `state`, key, `evicted`)
}
