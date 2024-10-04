import type { AtomToken } from "atom.io"

import type { Store } from ".."
import { getUpdateToken, isChildStore, newest, withdraw } from ".."

export function disposeAtom(atomToken: AtomToken<unknown>, store: Store): void {
	const target = newest(store)
	const { key } = atomToken
	const atom = withdraw(atomToken, target)
	if (!atom.family) {
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
		target.selectorAtoms.delete(key)
		target.atomsThatAreDefault.delete(key)
		store.timelineTopics.delete(key)

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
