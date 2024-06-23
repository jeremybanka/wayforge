import type { AtomToken } from "atom.io"

import type { Store } from ".."
import {
	disposeSelector,
	getUpdateToken,
	isChildStore,
	newest,
	withdraw,
} from ".."

export function disposeAtom(atomToken: AtomToken<unknown>, store: Store): void {
	const target = newest(store)
	const { key } = atomToken
	const atom = target.atoms.get(key)
	if (!atom) {
		store.logger.error(
			`❌`,
			`atom`,
			key,
			`Tried to dispose atom, but it does not exist in the store.`,
		)
	} else if (!atom.family) {
		store.logger.error(`❌`, `atom`, key, `Standalone atoms cannot be disposed.`)
	} else {
		atom.cleanup?.()
		const lastValue = store.valueMap.get(atom.key)
		const family = withdraw({ key: atom.family.key, type: `atom_family` }, store)
		family.subject.next({
			type: `state_disposal`,
			token: atomToken,
			value: lastValue,
		})
		const molecule = target.molecules.get(atom.family.subKey)
		if (molecule) {
			molecule.tokens.delete(key)
		}
		target.atoms.delete(key)
		target.valueMap.delete(key)
		const selectorKeys = target.selectorAtoms.getRelatedKeys(key)
		if (selectorKeys) {
			for (const selectorKey of selectorKeys) {
				const token =
					target.selectors.get(selectorKey) ??
					target.readonlySelectors.get(selectorKey)
				if (token) {
					disposeSelector(token, store)
				}
			}
		}
		target.selectorAtoms.delete(key)
		target.atomsThatAreDefault.delete(key)
		target.timelineTopics.delete(key)
		if (atomToken.type === `mutable_atom`) {
			const updateToken = getUpdateToken(atomToken)
			disposeAtom(updateToken, store)
			store.trackers.delete(key)
		}
		store.logger.info(`🔥`, `atom`, key, `deleted`)
		if (isChildStore(target) && target.transactionMeta.phase === `building`) {
			target.transactionMeta.update.updates.push({
				type: `state_disposal`,
				token: atomToken,
			})
		} else {
			store.on.atomDisposal.next(atomToken)
		}
	}
}
