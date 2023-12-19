import type { Atom } from "../atom"
import { isAtomDefault, markAtomAsNotDefault } from "../atom"
import { cacheValue } from "../caching"
import { markDone } from "../operation"
import { readOrComputeValue } from "../read-or-compute-value"
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
	const oldValue = readOrComputeValue(atom, store)
	let newValue = copyMutableIfWithinTransaction(oldValue, atom, store)
	newValue = become(next)(newValue)
	store.logger.info(`📝`, `atom`, atom.key, `set to`, newValue)
	newValue = cacheValue(atom.key, newValue, atom.subject, store)
	if (isAtomDefault(atom.key, store)) {
		markAtomAsNotDefault(atom.key, store)
	}
	markDone(atom.key, store)
	evictDownStream(atom, store)
	const update = { oldValue, newValue }
	if (store.transactionMeta === null && store.child === null) {
		emitUpdate(atom, update, store)
	} else {
		stowUpdate(atom, update, store)
	}
}
