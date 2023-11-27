import type { AtomToken } from "atom.io"

import type { Store } from ".."
import { deleteSelector, target } from ".."

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
	const selectorKeys = core.selectorAtoms.getRelatedKeys(key)
	if (selectorKeys) {
		for (const selectorKey of selectorKeys) {
			const token =
				core.selectors.get(selectorKey) ??
				core.readonlySelectors.get(selectorKey)
			if (token) {
				deleteSelector(token, store)
			}
		}
	}
	core.selectorAtoms.delete(key)
	core.atomsThatAreDefault.delete(key)
	core.timelineAtoms.delete(key)
	store.logger.info(`🔥`, `atom`, `${key}`, `deleted`)
}
