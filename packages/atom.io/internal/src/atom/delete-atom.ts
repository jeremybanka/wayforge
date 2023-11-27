import type { AtomToken } from "~/packages/atom.io/src"
import type { Store } from ".."
import { target } from ".."

export function deleteAtom(atomToken: AtomToken<unknown>, store: Store): void {
	const core = target(store)
	const { key } = atomToken
	core.atoms.delete(key)
	core.valueMap.delete(key)
	core.selectorAtoms.delete(key)
	core.atomsThatAreDefault.delete(key)
	core.timelineAtoms.delete(key)
	store.logger.info(`🔥`, `atom`, `${key}`, `deleted`)
}
