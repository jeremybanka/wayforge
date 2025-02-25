import type { Atom } from ".."
import { isAtomDefault, markAtomAsNotDefault } from "../atom"
import { cacheValue } from "../caching"
import { readOrComputeValue } from "../get-state/read-or-compute-value"
import type { Transceiver } from "../mutable"
import { markDone } from "../operation"
import type { Store } from "../store"
import { isChildStore, isRootStore } from "../transaction/is-root-store"
import { become } from "./become"
import { copyMutableIfNeeded } from "./copy-mutable-if-needed"
import { emitUpdate } from "./emit-update"
import { evictDownStream } from "./evict-downstream"
import { stowUpdate } from "./stow-update"

export const setAtom = <T>(
	atom: Atom<T>,
	next: T | ((oldValue: T) => T),
	target: Store,
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
	if (isAtomDefault(target, atom.key)) {
		markAtomAsNotDefault(target, atom.key)
	}
	markDone(target, atom.key)
	evictDownStream(target, atom)
	const update = { oldValue, newValue }
	if (isRootStore(target)) {
		emitUpdate(target, atom, update)
	} else if (target.parent) {
		if (target.on.transactionApplying.state === null) {
			stowUpdate(target, atom, update)
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
}
