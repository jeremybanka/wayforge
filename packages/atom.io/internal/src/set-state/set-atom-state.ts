import { become } from "~/packages/anvl/src/function"

import type { Atom } from "../atom"
import { isAtomDefault, markAtomAsNotDefault } from "../atom"
import { cacheValue } from "../caching"
import { getState__INTERNAL } from "../get-state-internal"
import { markDone } from "../operation"
import { IMPLICIT } from "../store"
import type { Store } from "../store"
import { copyMutableIfWithinTransaction } from "./copy-mutable-in-transaction"
import { emitUpdate } from "./emit-update"
import { evictDownStream } from "./evict-downstream"
import { stowUpdate } from "./stow-update"

export const setAtomState = <T>(
	atom: Atom<T>,
	next: T | ((oldValue: T) => T),
	store: Store = IMPLICIT.STORE,
): void => {
	copyMutableIfWithinTransaction(atom, store)
	const oldValue = getState__INTERNAL(atom, store)
	const newValue = become(next)(oldValue)
	store.config.logger?.info(`<< setting atom "${atom.key}" to`, newValue)
	cacheValue(atom.key, newValue, store)
	if (isAtomDefault(atom.key, store)) {
		markAtomAsNotDefault(atom.key, store)
	}
	markDone(atom.key, store)
	store.config.logger?.info(
		`   || evicting caches downstream from "${atom.key}"`,
	)
	evictDownStream(atom, store)
	const update = { oldValue, newValue }
	if (store.transactionStatus.phase !== `building`) {
		emitUpdate(atom, update, store)
	} else {
		stowUpdate(atom, update, store)
	}
}
