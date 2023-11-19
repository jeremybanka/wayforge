import type { AtomToken } from "~/packages/atom.io/src"
import type { Store } from ".."
import { IMPLICIT, target } from ".."

export function deleteAtom(
	atomToken: AtomToken<unknown>,
	store: Store = IMPLICIT.STORE,
): void {
	const core = target(store)
	const { key } = atomToken
	core.atoms.delete(key)
	core.valueMap.delete(key)
	core.selectorAtoms.delete(key)
	core.atomsThatAreDefault.delete(key)
	core.timelineAtoms.delete(key)
	store.logger.info(`🔥 Atom "${key}" deleted`)
}
