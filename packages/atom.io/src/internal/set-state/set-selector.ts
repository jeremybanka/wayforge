import type { WritableSelectorToken } from "atom.io"

import { writeToCache } from "../caching"
import { markDone, type OpenOperation } from "../operation"
import type { Store } from "../store"
import { withdraw } from "../store"
import { become } from "./become"
import { dispatchOrDeferStateUpdate } from "./dispatch-state-update"

export function setSelector<T>(
	target: Store & { operation: OpenOperation<any> },
	token: WritableSelectorToken<T>,
	next: T | ((oldValue: T) => T),
): void {
	let oldValue: T
	let newValue: T
	let constant: T

	const { type, key } = token
	const selector = withdraw(target, token)

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
	dispatchOrDeferStateUpdate(target, selector, oldValue, newValue)
}
