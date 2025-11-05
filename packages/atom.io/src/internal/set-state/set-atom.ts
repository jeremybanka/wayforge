import { readFromCache, writeToCache } from "../caching"
import { readOrComputeValue } from "../get-state/read-or-compute-value"
import { isFn } from "../is-fn"
import type { OpenOperation } from "../operation"
import { markDone } from "../operation"
import type { Atom } from "../state-types"
import type { Store } from "../store"
import { evictDownstreamFromAtom } from "./evict-downstream"
import type { ProtoUpdate } from "./operate-on-store"

const UNSET = Symbol(`UNSET`)

export const setAtom = <T>(
	target: Store & { operation: OpenOperation<any> },
	atom: Atom<T, any>,
	next: NoInfer<T> | ((oldValue: T) => NoInfer<T>),
): ProtoUpdate<T> => {
	let oldValue: T | typeof UNSET
	let newValue: T
	if (isFn(next)) {
		const prev = readOrComputeValue(target, atom, `mut`)
		oldValue = prev
		newValue = next(prev)
	} else {
		if (target.valueMap.has(atom.key)) {
			oldValue = readFromCache(target, atom, `mut`)
		} else {
			if (atom.type === `atom` && !isFn(atom.default)) {
				oldValue = atom.default
			} else {
				oldValue = UNSET
			}
		}
		newValue = next
	}
	target.logger.info(`⭐`, `atom`, atom.key, `setting value`, newValue)
	newValue = writeToCache(target, atom, newValue)
	markDone(target, atom.key)
	evictDownstreamFromAtom(target, atom)
	if (oldValue === UNSET) {
		return { newValue }
	}
	return { oldValue, newValue }
}
