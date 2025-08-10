import type { StateUpdate } from "atom.io"

import type { ReadableState, Transceiver } from "."
import { closeOperation, isChildStore, openOperation, Tracker } from "."
import { Future } from "./future"
import {
	evictDownStream,
	evictDownStreamFromSelector,
} from "./set-state/evict-downstream"
import type { Store } from "./store"
import type { Subject } from "./subject"

export function writeToCache<T>(
	target: Store,
	key: string,
	value: T,
	subject: Subject<StateUpdate<unknown>>,
): T
export function writeToCache<T extends Promise<any>>(
	target: Store,
	key: string,
	value: T,
	subject: Subject<StateUpdate<unknown>>,
): Future<Awaited<T>>
export function writeToCache<T>(
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
					writeToCache(target, key, resolved, subject)
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

export function readFromCache<T>(target: Store, state: ReadableState<T>): T {
	target.logger.info(`📖`, state.type, state.key, `reading cached value`)
	let value = target.valueMap.get(state.key) as T

	const mayNeedToBeCopied = state.type === `mutable_atom` && isChildStore(target)
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
