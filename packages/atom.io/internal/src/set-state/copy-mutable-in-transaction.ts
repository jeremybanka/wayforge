import type { AtomFamily } from "atom.io"
import type { Json, JsonInterface } from "atom.io/json"
import { getState__INTERNAL } from ".."
import type { Store, StoreCore } from ".."
import type { Atom } from "../atom"
import { copyMutableIfNeeded } from "./copy-mutable-if-needed"

export function copyMutableIfWithinTransaction<T>(
	atom: Atom<T> | (Atom<T> & JsonInterface<T, Json.Serializable>),
	store: Store,
): T {
	if (
		store.transactionStatus.phase === `building` ||
		store.transactionStatus.phase === `applying`
	) {
		if (`toJson` in atom && `fromJson` in atom) {
			const copiedValue = copyMutableIfNeeded(
				atom,
				atom,
				store,
				store.transactionStatus.core,
			)
			return copiedValue
		}
		if (`family` in atom) {
			const family = store.transactionStatus.core.families.get(atom.family.key)
			if (family && family.type === `atom_family`) {
				const result = copyMutableFamilyMemberWithinTransaction<T>(
					atom,
					family,
					store,
					store.transactionStatus.core,
				)
				if (result) {
					return result
				}
			}
		}
	}
	return getState__INTERNAL(atom, store)
}

export function copyMutableFamilyMemberWithinTransaction<T>(
	atom: Atom<T>,
	family:
		| AtomFamily<T, any>
		| (AtomFamily<T, any> & JsonInterface<T, Json.Serializable>),
	origin: StoreCore,
	target: StoreCore,
): T | null {
	if (`toJson` in family && `fromJson` in family) {
		const copyCreated = copyMutableIfNeeded(atom, family, origin, target)
		return copyCreated
	}
	return null
}
