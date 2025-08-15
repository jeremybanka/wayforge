import type { StateUpdateEvent } from "atom.io"

import type { Atom, MutableAtom, Store } from ".."
import { hasRole } from "../atom/has-role"
import { writeToCache } from "../caching"
import { readOrComputeValue } from "../get-state/read-or-compute-value"
import { isTransceiver, type Transceiver } from "../mutable"
import { markDone } from "../operation"
import { isChildStore } from "../transaction/is-root-store"
import { become } from "./become"
import { emitUpdate } from "./emit-update"
import { evictDownstreamFromAtom } from "./evict-downstream"

export const setAtom = <T>(
	target: Store,
	atom: Atom<T>,
	next: T | ((oldValue: T) => T),
): void => {
	const oldValue = readOrComputeValue(target, atom, `mut`)
	let newValue = become(next)(oldValue)
	target.logger.info(`📝`, `atom`, atom.key, `set to`, newValue)
	newValue = writeToCache(target, atom, newValue)
	markDone(target, atom.key)
	evictDownstreamFromAtom(target, atom)
	const update = { oldValue, newValue }
	if (!isChildStore(target)) {
		emitUpdate(target, atom, update)
		return
	}
	if (target.on.transactionApplying.state === null) {
		const { key } = atom
		if (isTransceiver(update.newValue)) {
			return
		}
		const atomUpdate: StateUpdateEvent<T> = {
			type: `atom_update`,
			key,
			timestamp: Date.now(), // 👺 use store operation
			update,
		}
		if (atom.family) {
			atomUpdate.family = atom.family
		}
		target.transactionMeta.update.subEvents.push(atomUpdate)
		target.logger.info(
			`📁`,
			`atom`,
			key,
			`stowed (`,
			update.oldValue,
			`->`,
			update.newValue,
			`)`,
		)
	} else if (hasRole(atom, `tracker:signal`)) {
		const key = atom.key.slice(1)
		const mutable = target.atoms.get(key) as MutableAtom<
			Transceiver<unknown, any, any>
		>
		const transceiver = readOrComputeValue(target, mutable, `mut`)
		const accepted = transceiver.do(update.newValue) === null
		if (accepted === true) {
			evictDownstreamFromAtom(target, mutable)
		}
	}
}
