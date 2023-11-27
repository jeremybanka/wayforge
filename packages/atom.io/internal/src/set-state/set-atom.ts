import type { Atom } from "../atom"
import { isAtomDefault, markAtomAsNotDefault } from "../atom"
import { cacheValue } from "../caching"
import { markDone } from "../operation"
import { readOrComputeCurrentState } from "../read-or-compute-current-state"
import type { Store } from "../store"
import { become } from "./become"
import { copyMutableIfWithinTransaction } from "./copy-mutable-in-transaction"
import { emitUpdate } from "./emit-update"
import { evictDownStream } from "./evict-downstream"
import { stowUpdate } from "./stow-update"

export const setAtom = <T>(
	atom: Atom<T>,
	next: T | ((oldValue: T) => T),
	store: Store,
): void => {
	const oldValue = readOrComputeCurrentState(atom, store)
	let newValue = copyMutableIfWithinTransaction(atom, store)
	newValue = become(next)(newValue)
	store.logger.info(`📝`, `atom`, atom.key, `set to`, newValue)
	newValue = cacheValue(atom.key, newValue, atom.subject, store)
	if (isAtomDefault(atom.key, store)) {
		markAtomAsNotDefault(atom.key, store)
	}
	markDone(atom.key, store)
	evictDownStream(atom, store)
	const update = { oldValue, newValue }
	if (store.transactionStatus.phase !== `building`) {
		emitUpdate(atom, update, store)
	} else {
		stowUpdate(atom, update, store)
	}
}
