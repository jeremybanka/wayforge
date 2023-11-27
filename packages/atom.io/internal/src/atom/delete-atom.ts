import type { AtomToken } from "~/packages/atom.io/src"
import type { Store } from ".."
import { target } from ".."

export function deleteAtom(atomToken: AtomToken<unknown>, store: Store): void {
	const core = target(store)
	const { key } = atomToken
	const atom = core.atoms.get(key)
	if (!atom) {
		store.logger.error(
			`❌`,
			`atom`,
			`${key}`,
			`Tried to delete atom, but it does not exist in the store.`,
		)
	}
	atom?.cleanup?.()
	core.atoms.delete(key)
	core.valueMap.delete(key)
	core.selectorAtoms.delete(key)
	core.atomsThatAreDefault.delete(key)
	core.timelineAtoms.delete(key)
	store.logger.info(`🔥`, `atom`, `${key}`, `deleted`)
}
