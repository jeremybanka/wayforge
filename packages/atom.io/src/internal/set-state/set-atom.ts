import type { StateUpdate } from "atom.io"

import type { Atom, Store } from ".."
import { writeToCache } from "../caching"
import { readOrComputeValue } from "../get-state/read-or-compute-value"
import { markDone } from "../operation"
import { become } from "./become"
import { evictDownstreamFromAtom } from "./evict-downstream"

export const setAtom = <T>(
	target: Store,
	atom: Atom<T>,
	next: T | ((oldValue: T) => T),
): StateUpdate<T> => {
	const oldValue = readOrComputeValue(target, atom, `mut`)
	let newValue = become(next)(oldValue)
	target.logger.info(`📝`, `atom`, atom.key, `set to`, newValue)
	newValue = writeToCache(target, atom, newValue)
	markDone(target, atom.key)
	evictDownstreamFromAtom(target, atom)
	return { oldValue, newValue }
}
