import type {
	AtomUpdateEvent,
	StateCreationEvent,
	StateUpdate,
	TimelineEvent,
} from "atom.io"

import { hasRole } from "../atom"
import { readOrComputeValue } from "../get-state"
import { newest } from "../lineage"
import type { Transceiver } from "../mutable"
import { isTransceiver } from "../mutable"
import type { OpenOperation } from "../operation"
import type { MutableAtom, WritableFamily, WritableState } from "../state-types"
import { deposit, type Store } from "../store"
import type { Subject } from "../subject"
import { isChildStore, isRootStore } from "../transaction"
import { evictDownstreamFromAtom } from "./evict-downstream"
import type { ProtoUpdate } from "./operate-on-store"

export function dispatchOrDeferStateUpdate<T, E>(
	target: Store & { operation: OpenOperation<any> },
	state: WritableState<T, E>,
	proto: ProtoUpdate<E | T>,
	stateIsNewlyCreated: boolean,
	family?: WritableFamily<T, any, E>,
): void {
	const { oldValue, newValue } = proto
	const hasOldValue = `oldValue` in proto
	const token = deposit(state)
	if (stateIsNewlyCreated && family) {
		state.subject.next({ newValue })
		const stateCreationEvent: StateCreationEvent<any> & TimelineEvent<any> = {
			checkpoint: true,
			type: `state_creation`,
			subType: `writable`,
			token,
			timestamp: Date.now(),
			value: newValue,
		}
		target.operation.subEvents.push(stateCreationEvent)
		const familySubject = family.subject as Subject<StateCreationEvent<any>>
		familySubject.next(stateCreationEvent)
		const innerTarget = newest(target)
		if (token.family) {
			if (isRootStore(innerTarget)) {
				switch (token.type) {
					case `atom`:
					case `mutable_atom`:
						target.on.atomCreation.next(token)
						break
					case `writable_pure_selector`:
					case `writable_held_selector`:
						target.on.selectorCreation.next(token)
						break
				}
			} else if (
				isChildStore(innerTarget) &&
				innerTarget.on.transactionApplying.state === null
			) {
				innerTarget.transactionMeta.update.subEvents.push(stateCreationEvent)
			}
		}
		return /* bailing early here to avoid redundant update */
	}
	const { key, subject, type } = state

	let update: StateUpdate<T>
	if (hasOldValue) {
		update = {
			oldValue: isTransceiver(oldValue) ? oldValue.READONLY_VIEW : oldValue,
			newValue: isTransceiver(newValue) ? newValue.READONLY_VIEW : newValue,
		}
	} else {
		update = {
			newValue: isTransceiver(newValue) ? newValue.READONLY_VIEW : newValue,
		}
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
					subject.subscribers.keys(),
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
					subject.subscribers.keys(),
				)
		}
		subject.next(update)
	}

	if (isChildStore(target) && (type === `mutable_atom` || type === `atom`)) {
		if (target.on.transactionApplying.state === null) {
			if (isTransceiver(newValue)) {
				return
			}
			const { timestamp } = target.operation
			const atomUpdate: AtomUpdateEvent<any> = {
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
				Transceiver<any, any, any>
			>
			const transceiver = readOrComputeValue<Transceiver<any, any, any>, never>(
				target,
				mutable,
				`mut`,
			)
			const accepted = transceiver.do(update.newValue) === null
			if (accepted === true) {
				evictDownstreamFromAtom(target, mutable)
			}
		}
	}
}
