import type { AtomToken } from "atom.io"

import type { Store } from ".."
import { deleteSelector, getUpdateToken, newest } from ".."

export function deleteAtom(atomToken: AtomToken<unknown>, store: Store): void {
	const target = newest(store)
	const { key } = atomToken
	const atom = target.atoms.get(key)
	if (!atom) {
		store.logger.error(
			`❌`,
			`atom`,
			key,
			`Tried to delete atom, but it does not exist in the store.`,
		)
	}
	atom?.cleanup?.()
	target.atoms.delete(key)
	target.valueMap.delete(key)
	const selectorKeys = target.selectorAtoms.getRelatedKeys(key)
	if (selectorKeys) {
		for (const selectorKey of selectorKeys) {
			const token =
				target.selectors.get(selectorKey) ??
				target.readonlySelectors.get(selectorKey)
			if (token) {
				deleteSelector(token, store)
			}
		}
	}
	target.selectorAtoms.delete(key)
	target.atomsThatAreDefault.delete(key)
	target.timelineAtoms.delete(key)
	if (atomToken.type === `mutable_atom`) {
		const updateToken = getUpdateToken(atomToken)
		deleteAtom(updateToken, store)
	}
	store.logger.info(`🔥`, `atom`, key, `deleted`)
}
