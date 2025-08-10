import type { KeyedStateUpdate } from "atom.io"

import type { Atom, MutableAtom, Store } from ".."
import { hasRole } from "../atom/has-role"
import { cacheValue, readCachedValue } from "../caching"
import { readOrComputeValue } from "../get-state/read-or-compute-value"
import { isTransceiver, type Transceiver } from "../mutable"
import { markDone } from "../operation"
import { isChildStore } from "../transaction/is-root-store"
import { become } from "./become"
import { emitUpdate } from "./emit-update"
import { evictDownStream } from "./evict-downstream"

export const setAtom = <T>(
	target: Store,
	atom: Atom<T>,
	next: T | ((oldValue: T) => T),
): void => {
	const oldValue = readOrComputeValue(target, atom)
	let newValue = become(next)(oldValue)
	target.logger.info(`📝`, `atom`, atom.key, `set to`, newValue)
	newValue = cacheValue(target, atom.key, newValue, atom.subject)
	markDone(target, atom.key)
	evictDownStream(target, atom)
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
		const atomUpdate: KeyedStateUpdate<T> = {
			type: `atom_update`,
			key,
			...update,
		}
		if (atom.family) {
			atomUpdate.family = atom.family
		}
		target.transactionMeta.update.updates.push(atomUpdate)
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
		const mutableKey = atom.key.slice(1)
		const mutable = target.atoms.get(mutableKey) as MutableAtom<any>
		const transceiver: Transceiver<any, any> = readCachedValue(target, mutable)
		const accepted = transceiver.do(update.newValue) === null
		if (accepted === true) {
			evictDownStream(target, mutable)
		}
	}
}
