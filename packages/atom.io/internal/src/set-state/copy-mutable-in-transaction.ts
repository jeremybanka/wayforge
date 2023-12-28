import type { AtomFamily } from "atom.io"
import type { Json, JsonInterface } from "atom.io/json"
import { newest } from ".."
import type { Store } from ".."
import type { Atom } from "../atom"
import { copyMutableIfNeeded } from "./copy-mutable-if-needed"

export function copyMutableIfWithinTransaction<T>(
	oldValue: T,
	atom: Atom<T> | (Atom<T> & JsonInterface<T, Json.Serializable>),
	store: Store,
): T {
	const target = newest(store)
	const parent = target.parent
	if (parent !== null) {
		if (`family` in atom) {
			const family = parent.families.get(atom.family.key)
			if (family && family.type === `atom_family`) {
				const result = copyMutableFamilyMemberWithinTransaction<T>(
					atom,
					family,
					parent,
					target,
				)
				if (result) {
					return result
				}
			}
		}
		if (`toJson` in atom && `fromJson` in atom) {
			const copiedValue = copyMutableIfNeeded(atom, atom, parent, target)
			return copiedValue
		}
	}
	return oldValue
}

export function copyMutableFamilyMemberWithinTransaction<T>(
	atom: Atom<T>,
	family:
		| AtomFamily<T, any>
		| (AtomFamily<T, any> & JsonInterface<T, Json.Serializable>),
	origin: Store,
	target: Store,
): T | null {
	if (`toJson` in family && `fromJson` in family) {
		const copyCreated = copyMutableIfNeeded(atom, family, origin, target)
		return copyCreated
	}
	return null
}
