import type { AtomToken, AtomUpdateEvent, StateUpdate } from "atom.io"

import type { MutableAtom, OpenOperation, Store } from ".."
import { withdraw } from ".."
import { hasRole } from "../atom/has-role"
import { writeToCache } from "../caching"
import { readOrComputeValue } from "../get-state/read-or-compute-value"
import { isTransceiver, type Transceiver } from "../mutable"
import { markDone } from "../operation"
import { isChildStore, isRootStore } from "../transaction/is-root-store"
import { become } from "./become"
import { dispatchStateUpdate } from "./dispatch-state-update"
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

	const update: StateUpdate<T> = {
		oldValue: isTransceiver(oldValue) ? oldValue.READONLY_VIEW : oldValue,
		newValue: isTransceiver(newValue) ? newValue.READONLY_VIEW : newValue,
	}

	if (isRootStore(target)) {
		dispatchStateUpdate(target, atom, update)
	}

	if (isChildStore(target)) {
		if (target.on.transactionApplying.state === null) {
			const { key } = atom
			if (isTransceiver(newValue)) {
				return
			}
			const { timestamp } = target.operation
			const atomUpdate: AtomUpdateEvent<AtomToken<T>> = {
				type: `atom_update`,
				token,
				timestamp,
				update,
			}
			target.transactionMeta.update.subEvents.push(atomUpdate)
			target.logger.info(
				`📁`,
				`atom`,
				key,
				`stowed (`,
				oldValue,
				`->`,
				newValue,
				`)`,
			)
			return
		}
		if (hasRole(atom, `tracker:signal`)) {
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
}
