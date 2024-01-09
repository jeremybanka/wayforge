import type { Atom } from "../atom"
import { isAtomDefault, markAtomAsNotDefault } from "../atom"
import { cacheValue } from "../caching"
import type { Transceiver } from "../mutable"
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
	target: Store,
): void => {
	const oldValue = readOrComputeValue(atom, target)
	let newValue = copyMutableIfWithinTransaction(oldValue, atom, target)
	newValue = become(next)(newValue)
	target.logger.info(`📝`, `atom`, atom.key, `set to`, newValue)
	newValue = cacheValue(atom.key, newValue, atom.subject, target)
	if (isAtomDefault(atom.key, target)) {
		markAtomAsNotDefault(atom.key, target)
	}
	markDone(atom.key, target)
	evictDownStream(atom, target)
	const update = { oldValue, newValue }
	if (target.transactionMeta === null) {
		emitUpdate(atom, update, target)
	} else if (target.on.transactionApplying && target.parent) {
		stowUpdate(atom, update, target)
		if (atom.key.startsWith(`*`)) {
			const mutableKey = atom.key.slice(1)
			const mutable: Transceiver<any> = target.valueMap.get(mutableKey)
			mutable.do(update.newValue)
		}
	}
}
