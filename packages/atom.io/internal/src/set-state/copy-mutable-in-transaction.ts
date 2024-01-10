import { newest } from ".."
import type { Atom, Store } from ".."
import { copyMutableIfNeeded } from "./copy-mutable-if-needed"

export function copyMutableIfWithinTransaction<T>(
	oldValue: T,
	atom: Atom<T>,
	store: Store,
): T {
	const target = newest(store)
	const parent = target.parent
	if (parent !== null) {
		if (atom.type === `mutable_atom`) {
			const copiedValue = copyMutableIfNeeded(atom, parent, target)
			return copiedValue
		}
	}
	return oldValue
}
