import type {
	AtomToken,
	AtomUpdateEvent,
	StateUpdate,
	WritableToken,
} from "atom.io"

import type { Atom, MutableAtom, Selector, WritableState } from ".."
import { hasRole } from "../atom"
import { readOrComputeValue } from "../get-state"
import type { Transceiver } from "../mutable"
import { isTransceiver } from "../mutable"
import type { OpenOperation } from "../operation"
import { deposit, type Store } from "../store"
import type { RootStore } from "../transaction"
import { isChildStore, isRootStore } from "../transaction"
import { evictDownstreamFromAtom } from "./evict-downstream"

export function dispatchOrDeferStateUpdate<T>(
	target: Store & { operation: OpenOperation<any> },
	state: WritableState<T>,
	[oldValue, newValue]: [T, T],
): void {
	const update: StateUpdate<T> = {
		oldValue: isTransceiver(oldValue) ? oldValue.READONLY_VIEW : oldValue,
		newValue: isTransceiver(newValue) ? newValue.READONLY_VIEW : newValue,
	}

	if (isRootStore(target)) {
		dispatchStateUpdate(target, state, update)
	}

	if (
		isChildStore(target) &&
		(state.type === `mutable_atom` || state.type === `atom`)
	) {
		if (target.on.transactionApplying.state === null) {
			const { key } = state
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
			const key = state.key.slice(1)
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

function dispatchStateUpdate<T>(
	store: RootStore,
	state: Atom<T> | Selector<T>,
	update: StateUpdate<T>,
): void {
	switch (state.type) {
		case `mutable_atom`:
			store.logger.info(
				`📢`,
				state.type,
				state.key,
				`is now (`,
				update.newValue,
				`) subscribers:`,
				state.subject.subscribers,
			)
			break
		case `atom`:
		case `writable_pure_selector`:
		case `readonly_pure_selector`:
		case `writable_held_selector`:
		case `readonly_held_selector`:
			store.logger.info(
				`📢`,
				state.type,
				state.key,
				`went (`,
				update.oldValue,
				`->`,
				update.newValue,
				`) subscribers:`,
				state.subject.subscribers,
			)
	}
	state.subject.next(update)
}
