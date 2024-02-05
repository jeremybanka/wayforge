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
	const oldValue = readOrComputeValue(atom, target)
	let newValue = oldValue
	if (atom.type === `mutable_atom` && isChildStore(target)) {
		const { parent } = target
		const copiedValue = copyMutableIfNeeded(atom, parent, target)
		newValue = copiedValue
	}
	newValue = become(next)(newValue)
	target.logger.info(`📝`, `atom`, atom.key, `set to`, newValue)
	newValue = cacheValue(atom.key, newValue, atom.subject, target)
	if (isAtomDefault(atom.key, target)) {
		markAtomAsNotDefault(atom.key, target)
	}
	markDone(atom.key, target)
	evictDownStream(atom, target)
	const update = { oldValue, newValue }
	if (isRootStore(target)) {
		emitUpdate(atom, update, target)
	} else if (target.parent) {
		if (target.on.transactionApplying.state === null) {
			stowUpdate(atom, update, target)
		} else if (atom.key.startsWith(`*`)) {
			const mutableKey = atom.key.slice(1)
			const mutableAtom = target.atoms.get(mutableKey) as Atom<any>
			if (mutableAtom.key === `ownersOfGroups/relatedKeys("jeremy")`) debugger
			let transceiver: Transceiver<any> = target.valueMap.get(mutableKey)
			if (mutableAtom.type === `mutable_atom` && isChildStore(target)) {
				const { parent } = target
				const copiedValue = copyMutableIfNeeded(mutableAtom, parent, target)
				transceiver = copiedValue
			}
			const accepted = transceiver.do(update.newValue) === null
			if (accepted) evictDownStream(mutableAtom, target)
		}
	}
}
