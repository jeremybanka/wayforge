import type { WritableSelector } from ".."
import { writeToCache } from "../caching"
import { markDone, type OpenOperation } from "../operation"
import type { Store } from "../store"
import { become } from "./become"

export function setSelector<T>(
	target: Store & { operation: OpenOperation<any> },
	selector: WritableSelector<T>,
	next: T | ((oldValue: T) => T),
): [oldValue: T, newValue: T] {
	let oldValue: T
	let newValue: T
	let constant: T

	const { type, key } = selector

	switch (selector.type) {
		case `writable_pure_selector`:
			oldValue = selector.getFrom(target)
			newValue = become(next)(oldValue)
			writeToCache(target, selector, newValue)
			break
		case `writable_held_selector`:
			constant = selector.const
			become(next)(constant)
			oldValue = constant
			newValue = constant
	}

	target.logger.info(`📝`, type, key, `setting to`, newValue)
	markDone(target, key)
	selector.setSelf(newValue)
	return [oldValue, newValue]
}
