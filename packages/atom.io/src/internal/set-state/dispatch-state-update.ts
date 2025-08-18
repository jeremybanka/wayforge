import type {
	AtomToken,
	AtomUpdateEvent,
	StateUpdate,
	WritableToken,
} from "atom.io"

import type { MutableAtom, WritableState } from ".."
import { hasRole } from "../atom"
import { readOrComputeValue } from "../get-state"
import type { Transceiver } from "../mutable"
import { isTransceiver } from "../mutable"
import type { OpenOperation } from "../operation"
import { deposit, type Store } from "../store"
import { isChildStore, isRootStore } from "../transaction"
import { evictDownstreamFromAtom } from "./evict-downstream"

export function dispatchOrDeferStateUpdate<T>(
	target: Store & { operation: OpenOperation<any> },
	state: WritableState<T>,
	[oldValue, newValue]: [T, T],
	_stateIsNewlyCreated: boolean,
): void {
	const { key, subject, type } = state

	const update: StateUpdate<T> = {
		oldValue: isTransceiver(oldValue) ? oldValue.READONLY_VIEW : oldValue,
		newValue: isTransceiver(newValue) ? newValue.READONLY_VIEW : newValue,
	}

	if (isRootStore(target)) {
		switch (type) {
			case `mutable_atom`:
				target.logger.info(
					`📢`,
					type,
					key,
					`is now (`,
					newValue,
					`) subscribers:`,
					subject.subscribers,
				)
				break
			case `atom`:
			case `writable_pure_selector`:
			case `writable_held_selector`:
				target.logger.info(
					`📢`,
					type,
					key,
					`went (`,
					oldValue,
					`->`,
					newValue,
					`) subscribers:`,
					subject.subscribers,
				)
		}
		subject.next(update)
	}

	if (isChildStore(target) && (type === `mutable_atom` || type === `atom`)) {
		if (target.on.transactionApplying.state === null) {
			const token: WritableToken<T> = deposit(state)

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
		if (hasRole(state, `tracker:signal`)) {
			const keyOfMutable = key.slice(1)
			const mutable = target.atoms.get(keyOfMutable) as MutableAtom<
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
