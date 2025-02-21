import type { AtomDisposal, AtomToken } from "atom.io"

import type { Store } from ".."
import { getUpdateToken, isChildStore, newest, withdraw } from ".."

export function disposeAtom(atomToken: AtomToken<unknown>, store: Store): void {
	const target = newest(store)
	const { key, family } = atomToken
	const atom = withdraw(atomToken, target)
	if (!family) {
		store.logger.error(`❌`, `atom`, key, `Standalone atoms cannot be disposed.`)
	} else {
		atom.cleanup?.()
		const lastValue = store.valueMap.get(atom.key)
		const atomFamily = withdraw({ key: family.key, type: `atom_family` }, store)

		const disposal: AtomDisposal<AtomToken<unknown>> = {
			type: `state_disposal`,
			subType: `atom`,
			token: atomToken,
			value: lastValue,
		}

		atomFamily.subject.next(disposal)

		const isChild = isChildStore(target)
		// let molecule = target.molecules.get(family.subKey)
		// if (molecule && isChild) {
		// 	const parentMolecule = target.parent.molecules.get(family.subKey)
		// 	if (parentMolecule === molecule) {
		// 		molecule = parentMolecule.copy()
		// 		target.molecules.set(family.subKey, molecule)
		// 	}
		// }
		// molecule?.tokens.delete(family.key)

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
		if (isChild && target.transactionMeta.phase === `building`) {
			const mostRecentUpdate = target.transactionMeta.update.updates.at(-1)
			const wasMoleculeDisposal = mostRecentUpdate?.type === `molecule_disposal`
			const updateAlreadyCaptured =
				wasMoleculeDisposal &&
				mostRecentUpdate.values.some(([k]) => k === atom.family?.key)

			if (!updateAlreadyCaptured) {
				target.transactionMeta.update.updates.push(disposal)
			}
		} else {
			store.on.atomDisposal.next(atomToken)
		}
	}
}
