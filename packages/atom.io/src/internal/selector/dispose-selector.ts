import type {
	SelectorDisposalEvent,
	SelectorFamilyToken,
	SelectorToken,
} from "atom.io"

import type { Store } from ".."
import { isChildStore, newest, withdraw } from ".."

export function disposeSelector(
	store: Store,
	selectorToken: SelectorToken<unknown>,
): void {
	const target = newest(store)
	const { key, type, family: familyMeta } = selectorToken
	if (!familyMeta) {
		store.logger.error(
			`❌`,
			type,
			key,
			`Standalone selectors cannot be disposed.`,
		)
	} else {
		const molecule = target.molecules.get(familyMeta.subKey)
		if (molecule) {
			target.moleculeData.delete(familyMeta.subKey, familyMeta.key)
		}
		let familyToken: SelectorFamilyToken<any, any>
		switch (selectorToken.type) {
			case `writable_held_selector`:
				{
					target.writableSelectors.delete(key)
					familyToken = {
						key: familyMeta.key,
						type: `writable_held_selector_family`,
					}
					const family = withdraw(store, familyToken)
					family.subject.next({
						type: `disposal`,
						subType: `selector`,
						token: selectorToken,
					})
				}
				break
			case `writable_pure_selector`:
				{
					target.writableSelectors.delete(key)
					familyToken = {
						key: familyMeta.key,
						type: `writable_pure_selector_family`,
					}
					const family = withdraw(store, familyToken)
					family.subject.next({
						type: `disposal`,
						subType: `selector`,
						token: selectorToken,
					})
				}
				break
			case `readonly_held_selector`:
				{
					target.readonlySelectors.delete(key)
					familyToken = {
						key: familyMeta.key,
						type: `readonly_held_selector_family`,
					}
					const family = withdraw(store, familyToken)
					family.subject.next({
						type: `disposal`,
						subType: `selector`,
						token: selectorToken,
					})
				}
				break
			case `readonly_pure_selector`:
				{
					target.readonlySelectors.delete(key)
					familyToken = {
						key: familyMeta.key,
						type: `readonly_pure_selector_family`,
					}
					const family = withdraw(store, familyToken)
					family.subject.next({
						type: `disposal`,
						subType: `selector`,
						token: selectorToken,
					})
				}
				break
		}

		target.valueMap.delete(key)
		target.selectorAtoms.delete(key)
		target.selectorGraph.delete(key)
		target.moleculeData.delete(familyMeta.key, familyMeta.subKey)
		store.logger.info(`🔥`, selectorToken.type, key, `deleted`)
		if (isChildStore(target) && target.transactionMeta.phase === `building`) {
			const event = {
				type: `disposal`,
				subType: `selector`,
				token: selectorToken,
			} satisfies SelectorDisposalEvent<any>
			target.transactionMeta.update.events.push(event)
		} else {
			store.on.selectorDisposal.next(selectorToken)
		}
	}
}
