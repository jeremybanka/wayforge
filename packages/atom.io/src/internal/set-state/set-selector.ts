import { readOrComputeValue, type WritableSelector } from ".."
import { writeToCache } from "../caching"
import { markDone, type OpenOperation } from "../operation"
import type { Store } from "../store"
import { become } from "./become"
import type { ProtoUpdate } from "./operate-on-store"

export function setSelector<T>(
	target: Store & { operation: OpenOperation<any> },
	selector: WritableSelector<T, any>,
	next: T | ((oldValue: T) => T),
): ProtoUpdate<T> {
	let oldValue: T
	let newValue: T
	let constant: T

	const { type, key } = selector

	switch (selector.type) {
		case `writable_pure_selector`:
			oldValue = readOrComputeValue(target, selector, `mut`)
			newValue = become(next, oldValue)
			newValue = writeToCache(target, selector, newValue)
			break
		case `writable_held_selector`:
			constant = selector.const
			become(next, constant)
			oldValue = constant
			newValue = constant
	}

	target.logger.info(`⭐`, type, key, `setting to`, newValue)
	markDone(target, key)
	selector.setSelf(newValue)
	return { oldValue, newValue }
}
