import type { ReadonlySelectorToken, WritableSelectorToken } from "atom.io"

import type { Store } from ".."
import { isChildStore, newest, withdraw } from ".."

export function disposeSelector(
	selectorToken: ReadonlySelectorToken<unknown> | WritableSelectorToken<unknown>,
	store: Store,
): void {
	const target = newest(store)
	const { key } = selectorToken
	const selector = withdraw(selectorToken, target)
	if (!selector.family) {
		store.logger.error(
			`❌`,
			`selector`,
			key,
			`Standalone selectors cannot be disposed.`,
		)
	} else {
		const molecule = target.molecules.get(selector.family.subKey)
		if (molecule) {
			molecule.tokens.delete(key)
		}
		switch (selectorToken.type) {
			case `selector`:
				{
					target.selectors.delete(key)
					const family = withdraw(
						{ key: selector.family.key, type: `selector_family` },
						store,
					)
					family.subject.next({
						type: `state_disposal`,
						token: selectorToken,
					})
				}
				break
			case `readonly_selector`:
				{
					target.readonlySelectors.delete(key)
					const family = withdraw(
						{ key: selector.family.key, type: `readonly_selector_family` },
						store,
					)
					family.subject.next({
						type: `state_disposal`,
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
				token: selectorToken,
			})
		} else {
			store.on.selectorDisposal.next(selectorToken)
		}
	}
}
