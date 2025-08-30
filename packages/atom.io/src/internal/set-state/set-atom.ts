import type { Atom, OpenOperation, Store } from ".."
import { writeToCache } from "../caching"
import { readOrComputeValue } from "../get-state/read-or-compute-value"
import { markDone } from "../operation"
import { become } from "./become"
import { evictDownstreamFromAtom } from "./evict-downstream"
import type { ProtoUpdate } from "./operate-on-store"

export const setAtom = <T>(
	target: Store & { operation: OpenOperation<any> },
	atom: Atom<T, any>,
	next: NoInfer<T> | ((oldValue: T) => NoInfer<T>),
): ProtoUpdate<T> => {
	const oldValue = readOrComputeValue(target, atom, `mut`)
	let newValue = become(next, oldValue)
	target.logger.info(`⭐`, `atom`, atom.key, `setting value`, newValue)
	newValue = writeToCache(target, atom, newValue)
	markDone(target, atom.key)
	evictDownstreamFromAtom(target, atom)
	return { oldValue, newValue }
}
