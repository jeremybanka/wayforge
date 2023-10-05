import type { StateUpdate } from "../../src"
import type { Store } from "./store"
import { IMPLICIT } from "./store"
import type { Subject } from "./subject"
import { target } from "./transaction"

export class Future<T> extends Promise<T> {
	private isCanceled = false

	public constructor(
		executor:
			| Promise<T>
			| ((resolve: (value: T) => void, reject: (reason?: any) => void) => void),
	) {
		super((resolve, reject) => {
			const pass = (value: T) =>
				this.isCanceled ? reject({ isCanceled: true }) : resolve(value)
			const fail = (reason: any) =>
				this.isCanceled ? reject({ isCanceled: true }) : reject(reason)
			if (typeof executor === `function`) {
				executor(pass, fail)
			} else {
				executor.then(pass, fail)
			}
		})
	}

	public cancel(): void {
		this.isCanceled = true
	}
}

export const cacheValue = (
	key: string,
	value: unknown,
	subject: Subject<StateUpdate<unknown>>,
	store: Store = IMPLICIT.STORE,
): void => {
	// const currentValue = target(store).valueMap.get(key)
	// if (currentValue instanceof Promise) {
	// 	currentValue.then((currentValue) => {
	// 		target(store).valueMap.set(key, value)
	// 		subject.next({ newValue: value, oldValue: currentValue })
	// 	})
	// 	return
	// }
	if (value instanceof Promise) {
		const future = new Future(value)
		target(store).valueMap.set(key, future)
		future.then((value) => {
			cacheValue(key, value, subject, store)
			subject.next({ newValue: value, oldValue: value })
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
