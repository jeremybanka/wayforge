import type { StoreCore } from ".."
import { IMPLICIT, target } from ".."

export function deleteAtom(key: string, core: StoreCore = IMPLICIT.STORE): void {
	core.atoms.delete(key)
	core.valueMap.delete(key)
	core.selectorAtoms.delete(key)
	core.atomsThatAreDefault.delete(key)
	core.timelineAtoms.delete(key)
}
