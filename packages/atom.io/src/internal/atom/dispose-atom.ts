import type { AtomDisposalEvent, AtomToken, StateLifecycleEvent } from "atom.io"

import type { Store, Subject } from ".."
import { getUpdateToken, isChildStore, newest, withdraw } from ".."
import { getFamilyOfToken } from "../families/get-family-of-token"

export function disposeAtom(store: Store, atomToken: AtomToken<any>): void {
	const target = newest(store)
	const { key, family } = atomToken
	const atom = withdraw(target, atomToken)
	if (!family) {
		store.logger.error(`❌`, `atom`, key, `Standalone atoms cannot be disposed.`)
	} else {
		atom.cleanup?.()
		const lastValue = store.valueMap.get(atom.key)
		// biome-ignore lint/style/noNonNullAssertion: family has been verified
		const familyToken = getFamilyOfToken(store, atomToken)!
		const atomFamily = withdraw(store, familyToken)
		const subject = atomFamily.subject as Subject<
			StateLifecycleEvent<AtomToken<any>>
		>

		const disposal: AtomDisposalEvent<AtomToken<any>> = {
			type: `state_disposal`,
			subType: `atom`,
			token: atomToken,
			value: lastValue,
			timestamp: Date.now(),
		}

		subject.next(disposal)

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
			const mostRecentUpdate = target.transactionMeta.update.subEvents.at(-1)
			const wasMoleculeDisposal = mostRecentUpdate?.type === `molecule_disposal`
			const updateAlreadyCaptured =
				wasMoleculeDisposal &&
				mostRecentUpdate.values.some(([k]) => k === atom.family?.key)

			if (!updateAlreadyCaptured) {
				target.transactionMeta.update.subEvents.push(disposal)
			}
		} else {
			store.on.atomDisposal.next(atomToken)
		}
	}
}
