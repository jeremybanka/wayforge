import type { SelectorFamilyToken, SelectorToken } from "atom.io"

import type { Store } from ".."
import { isChildStore, newest, withdraw } from ".."

export function disposeSelector(
	store: Store,
	selectorToken: SelectorToken<unknown>,
): void {
	const target = newest(store)
	const { key } = selectorToken
	const selector = withdraw(target, selectorToken)
	if (!selector.family) {
		store.logger.error(
			`❌`,
			`writable_transient_selector`,
			key,
			`Standalone selectors cannot be disposed.`,
		)
	} else {
		const molecule = target.molecules.get(selector.family.subKey)
		if (molecule) {
			target.moleculeData.delete(selector.family.subKey, selector.family.key)
		}
		let familyToken: SelectorFamilyToken<any, any>
		switch (selectorToken.type) {
			case `writable_transient_selector`:
				{
					target.writableSelectors.delete(key)
					familyToken = {
						key: selector.family.key,
						type: `writable_transient_selector_family`,
					}
					const family = withdraw(store, familyToken)
					family.subject.next({
						type: `state_disposal`,
						subType: `selector`,
						token: selectorToken,
					})
				}
				break
			case `readonly_transient_selector`:
				{
					target.readonlySelectors.delete(key)
					familyToken = {
						key: selector.family.key,
						type: `readonly_transient_selector_family`,
					}
					const family = withdraw(store, familyToken)
					family.subject.next({
						type: `state_disposal`,
						subType: `selector`,
						token: selectorToken,
					})
				}
				break
		}

		target.valueMap.delete(key)
		target.selectorAtoms.delete(key)
		target.selectorGraph.delete(key)
		store.logger.info(`🔥`, selectorToken.type, key, `deleted`)
		if (isChildStore(target) && target.transactionMeta.phase === `building`) {
			target.transactionMeta.update.updates.push({
				type: `state_disposal`,
				subType: `selector`,
				token: selectorToken,
			})
		} else {
			store.on.selectorDisposal.next(selectorToken)
		}
	}
}
