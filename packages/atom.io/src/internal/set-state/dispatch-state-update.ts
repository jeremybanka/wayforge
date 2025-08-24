import type {
	AtomUpdateEvent,
	ReadableToken,
	StateCreationEvent,
	StateUpdate,
} from "atom.io"

import {
	type MutableAtom,
	newest,
	type Subject,
	type WritableFamily,
	type WritableState,
} from ".."
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
	stateIsNewlyCreated: boolean,
	family?: WritableFamily<T, any>,
): void {
	const token = deposit(state)
	if (stateIsNewlyCreated && family) {
		const stateCreationEvent: StateCreationEvent<ReadableToken<T>> = {
			type: `state_creation`,
			token,
			timestamp: Date.now(),
		}
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
	}
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
