import type { AtomToken } from "atom.io"

import type { OpenOperation, Store } from ".."
import { withdraw } from ".."
import { writeToCache } from "../caching"
import { readOrComputeValue } from "../get-state/read-or-compute-value"
import { markDone } from "../operation"
import { become } from "./become"
import { dispatchOrDeferStateUpdate } from "./dispatch-state-update"
import { evictDownstreamFromAtom } from "./evict-downstream"

export const setAtom = <T>(
	target: Store & { operation: OpenOperation<any> },
	token: AtomToken<T>,
	next: T | ((oldValue: T) => T),
): void => {
	const atom = withdraw(target, token)
	const oldValue = readOrComputeValue(target, atom, `mut`)
	let newValue = become(next)(oldValue)
	target.logger.info(`📝`, `atom`, atom.key, `set to`, newValue)
	newValue = writeToCache(target, atom, newValue)
	markDone(target, atom.key)
	evictDownstreamFromAtom(target, atom)

	dispatchOrDeferStateUpdate(target, atom, oldValue, newValue)
}
