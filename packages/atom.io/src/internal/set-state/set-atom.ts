import type { KeyedStateUpdate } from "atom.io"

import type { Atom, Store } from ".."
import { cacheValue } from "../caching"
import { readOrComputeValue } from "../get-state/read-or-compute-value"
import { isTransceiver, type Transceiver } from "../mutable"
import { markDone } from "../operation"
import { isChildStore } from "../transaction/is-root-store"
import { become } from "./become"
import { copyMutableIfNeeded } from "./copy-mutable-if-needed"
import { emitUpdate } from "./emit-update"
import { evictDownStream } from "./evict-downstream"

export const setAtom = <T>(
	target: Store,
	atom: Atom<T>,
	next: T | ((oldValue: T) => T),
): void => {
	const oldValue = readOrComputeValue(target, atom)
	let newValue = oldValue
	if (atom.type === `mutable_atom` && isChildStore(target)) {
		const { parent } = target
		const copiedValue = copyMutableIfNeeded(target, atom, parent)
		newValue = copiedValue
	}
	newValue = become(next)(newValue)
	target.logger.info(`📝`, `atom`, atom.key, `set to`, newValue)
	newValue = cacheValue(target, atom.key, newValue, atom.subject)
	markDone(target, atom.key)
	evictDownStream(target, atom)
	const update = { oldValue, newValue }
	if (!isChildStore(target)) {
		emitUpdate(target, atom, update)
		return
	}
	if (target.on.transactionApplying.state === null) {
		const { key } = atom
		if (isTransceiver(update.newValue)) {
			return
		}
		const atomUpdate: KeyedStateUpdate<T> = {
			type: `atom_update`,
			key,
			...update,
		}
		if (atom.family) {
			atomUpdate.family = atom.family
		}
		target.transactionMeta.update.updates.push(atomUpdate)
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
	} else if (atom.key.startsWith(`*`)) {
		const mutableKey = atom.key.slice(1)
		const mutableAtom = target.atoms.get(mutableKey) as Atom<any>
		let transceiver: Transceiver<any> = target.valueMap.get(mutableKey)
		if (mutableAtom.type === `mutable_atom` && isChildStore(target)) {
			const { parent } = target
			const copiedValue = copyMutableIfNeeded(target, mutableAtom, parent)
			transceiver = copiedValue
		}
		const accepted = transceiver.do(update.newValue) === null
		if (accepted) evictDownStream(target, mutableAtom)
	}
}
