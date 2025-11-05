import { readFromCache, writeToCache } from "../caching"
import { readOrComputeValue } from "../get-state/read-or-compute-value"
import { isFn } from "../is-fn"
import type { OpenOperation } from "../operation"
import { markDone } from "../operation"
import type { Atom } from "../state-types"
import type { Store } from "../store"
import { become } from "./become"
import { evictDownstreamFromAtom } from "./evict-downstream"
import type { ProtoUpdate } from "./operate-on-store"

export const setAtom = <T>(
	target: Store & { operation: OpenOperation<any> },
	atom: Atom<T, any>,
	next: NoInfer<T> | ((oldValue: T) => NoInfer<T>),
): ProtoUpdate<T> => {
	// const oldValue = readOrComputeValue(target, atom, `mut`)
	// let newValue = become(next, oldValue)
	let oldValue: T | undefined
	let newValue: T
	if (isFn(next)) {
		const prev = readOrComputeValue(target, atom, `mut`)
		oldValue = prev
		newValue = next(prev)
	} else {
		oldValue = readFromCache(target, atom, `mut`)
		newValue = next
	}
	target.logger.info(`⭐`, `atom`, atom.key, `setting value`, newValue)
	newValue = writeToCache(target, atom, newValue)
	markDone(target, atom.key)
	evictDownstreamFromAtom(target, atom)
	if (oldValue) {
		return { oldValue, newValue }
	}
	return { newValue }
}
