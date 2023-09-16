import type { Store } from ".."
import { IMPLICIT, target } from ".."

export function deleteAtom(key: string, store: Store = IMPLICIT.STORE): void {
	const core = target(store)
	core.atoms.delete(key)
	core.valueMap.delete(key)
	core.selectorAtoms.delete(key)
	core.atomsThatAreDefault.delete(key)
	core.timelineAtoms.delete(key)
}
