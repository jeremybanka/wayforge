import type { AtomDisposalEvent, AtomToken } from "atom.io"

import type { Store } from ".."
import { getUpdateToken, isChildStore, newest, withdraw } from ".."

export function disposeAtom(store: Store, atomToken: AtomToken<unknown>): void {
	const target = newest(store)
	const { key, family } = atomToken
	const atom = withdraw(target, atomToken)
	if (!family) {
		store.logger.error(`❌`, `atom`, key, `Standalone atoms cannot be disposed.`)
	} else {
		atom.cleanup?.()
		const lastValue = store.valueMap.get(atom.key)
		const atomFamily = withdraw(store, { key: family.key, type: `atom_family` })

		const disposal: AtomDisposalEvent<unknown> = {
			type: `disposal`,
			subType: `atom`,
			token: atomToken,
			value: lastValue,
			events: [],
		}

		atomFamily.subject.next(disposal)

		const isChild = isChildStore(target)

		target.atoms.delete(key)
		target.valueMap.delete(key)
		target.selectorAtoms.delete(key)
		target.atomsThatAreDefault.delete(key)
		target.moleculeData.delete(family.key, family.subKey)
		store.timelineTopics.delete(key)

		if (atomToken.type === `mutable_atom`) {
			const updateToken = getUpdateToken(atomToken)
			disposeAtom(store, updateToken)
			store.trackers.delete(key)
		}
		store.logger.info(`🔥`, `atom`, key, `deleted`)
		if (isChild && target.transactionMeta.phase === `building`) {
			const mostRecentUpdate = target.transactionMeta.update.events.at(-1)
			const wasMoleculeDisposal = mostRecentUpdate?.type === `molecule_disposal`
			const updateAlreadyCaptured =
				wasMoleculeDisposal &&
				mostRecentUpdate.values.some(([k]) => k === atom.family?.key)

			if (!updateAlreadyCaptured) {
				target.transactionMeta.update.events.push(disposal)
			}
		} else {
			store.on.atomDisposal.next(atomToken)
		}
	}
}
