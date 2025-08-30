import { writeToCache } from "../caching"
import { readOrComputeValue } from "../get-state/read-or-compute-value"
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
	const oldValue = readOrComputeValue(target, atom, `mut`)
	let newValue = become(next, oldValue)
	target.logger.info(`⭐`, `atom`, atom.key, `setting value`, newValue)
	newValue = writeToCache(target, atom, newValue)
	markDone(target, atom.key)
	evictDownstreamFromAtom(target, atom)
	return { oldValue, newValue }
}
