import type { StateUpdate } from "atom.io"

import type { ReadableState } from "."
import { closeOperation, isChildStore, openOperation } from "."
import { Future } from "./future"
import { copyMutableIfNeeded } from "./set-state/copy-mutable-if-needed"
import {
	evictDownStream,
	evictDownStreamFromSelector,
} from "./set-state/evict-downstream"
import type { Store } from "./store"
import type { Subject } from "./subject"

export function cacheValue<T>(
	store: Store,
	key: string,
	value: T,
	subject: Subject<StateUpdate<unknown>>,
): T
export function cacheValue<T extends Promise<any>>(
	store: Store,
	key: string,
	value: T,
	subject: Subject<StateUpdate<unknown>>,
): Future<T>
export function cacheValue<T>(
	target: Store,
	key: string,
	value: T,
	subject: Subject<StateUpdate<unknown>>,
): Future<T> | T {
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
					cacheValue(target, key, resolved, subject)
					const atom = target.atoms.get(key)
					if (atom) {
						openOperation(target, atom)
						evictDownStream(target, atom)
						closeOperation(target)
					} else {
						const selector =
							target.writableSelectors.get(key) ??
							target.readonlySelectors.get(key)
						if (selector) {
							openOperation(target, selector)
							evictDownStreamFromSelector(target, selector)
							closeOperation(target)
						}
					}
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

export const readCachedValue = <T>(
	state: ReadableState<any>,
	target: Store,
): T => {
	target.logger.info(`📖`, state.type, state.key, `reading cached value`)
	let value = target.valueMap.get(state.key) as T
	if (state.type === `mutable_atom` && isChildStore(target)) {
		const { parent } = target
		const copiedValue = copyMutableIfNeeded(target, state, parent)
		value = copiedValue
	}
	return value
}

export const evictCachedValue = (target: Store, key: string): void => {
	const currentValue = target.valueMap.get(key)
	if (currentValue instanceof Future) {
		const selector =
			target.writableSelectors.get(key) ?? target.readonlySelectors.get(key)
		if (selector) {
			selector.get()
		}
		return
	}
	if (target.operation.open) {
		target.operation.prev.set(key, currentValue)
	}
	target.valueMap.delete(key)
	target.logger.info(`🗑`, `state`, key, `evicted`)
}
