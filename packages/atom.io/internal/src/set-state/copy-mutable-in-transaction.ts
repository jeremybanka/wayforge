import { newest } from ".."
import type { Atom, Store } from ".."
import { copyMutableIfNeeded } from "./copy-mutable-if-needed"

// ♻️ REFACTOR SMALLER

export function copyMutableIfWithinTransaction<T>(
	oldValue: T,
	atom: Atom<T>,
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
					parent,
					target,
				)
				if (result) {
					return result
				}
			}
		}
		if (atom.type === `mutable_atom`) {
			const copiedValue = copyMutableIfNeeded(atom, parent, target)
			return copiedValue
		}
	}
	return oldValue
}

export function copyMutableFamilyMemberWithinTransaction<T>(
	atom: Atom<T>,
	origin: Store,
	target: Store,
): T | null {
	if (atom.type === `mutable_atom`) {
		const copyCreated = copyMutableIfNeeded(atom, origin, target)
		return copyCreated
	}
	return null
}
