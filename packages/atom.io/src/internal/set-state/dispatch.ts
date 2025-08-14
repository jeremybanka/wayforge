import type {
	ReadableToken,
	StateCreationEvent,
	StateUpdate,
	StateUpdateEvent,
} from "atom.io"

import type {
	Atom,
	ChildStore,
	MutableAtom,
	ReadableFamily,
	RootStore,
	Selector,
	Store,
	Subject,
	Transceiver,
	ViewOf,
} from ".."
import {
	deposit,
	evictDownstreamFromAtom,
	hasRole,
	isChildStore,
	isRootStore,
	isTransceiver,
	newest,
	readOrComputeValue,
} from ".."

export function emitStateUpdate<T>(
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

export function emitStateCreation<T>(
	store: Store,
	family: ReadableFamily<T, any>,
	token: ReadableToken<T>,
	value: ViewOf<T>,
): void {
	let subType: StateCreationEvent<any>[`subType`]
	let stateCreation: StateCreationEvent<any>
	switch (token.type) {
		case `atom`:
		case `mutable_atom`:
			subType = `atom`
			stateCreation = {
				type: `creation`,
				subType,
				token,
				value,
			}
			break
		case `writable_pure_selector`:
		case `readonly_pure_selector`:
		case `writable_held_selector`:
		case `readonly_held_selector`:
			subType = `selector`
			stateCreation = {
				type: `creation`,
				subType,
				token,
				value,
				events: [],
			}
	}

	const subject = family.subject as Subject<StateCreationEvent<any>>
	subject.next(stateCreation)
	const target = newest(store)
	if (token.family) {
		if (isRootStore(target)) {
			switch (token.type) {
				case `atom`:
				case `mutable_atom`:
					store.on.atomCreation.next(token)
					break
				case `writable_pure_selector`:
				case `readonly_pure_selector`:
				case `writable_held_selector`:
				case `readonly_held_selector`:
					store.on.selectorCreation.next(token)
					break
			}
		} else if (
			isChildStore(target) &&
			target.on.transactionApplying.state === null
		) {
			target.transactionMeta.update.events.push(stateCreation)
		}
	}
}

export function deferDispatchUpdateForTransaction(
	target: ChildStore,
	atom: Atom<any>,
	update: StateUpdate<any>,
): void {
	if (target.on.transactionApplying.state === null) {
		const { key } = atom
		if (isTransceiver(update.newValue)) {
			return
		}
		const atomUpdate: StateUpdateEvent<any> = {
			type: `update`,
			subType: `atom`,
			token: deposit(atom),
			update,
		}
		target.transactionMeta.update.events.push(atomUpdate)
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
