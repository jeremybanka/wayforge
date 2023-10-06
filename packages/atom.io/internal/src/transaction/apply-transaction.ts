import type { AtomToken, ƒn } from "atom.io"
import { setState, transaction } from "atom.io"

import { withdraw } from "../store"
import type { Store } from "../store"

export const applyTransaction = <ƒ extends ƒn>(
	output: ReturnType<ƒ>,
	store: Store,
): void => {
	if (store.transactionStatus.phase !== `building`) {
		store.config.logger?.warn(
			`abortTransaction called outside of a transaction. This is probably a bug.`,
		)
		return
	}
	store.transactionStatus.phase = `applying`
	store.transactionStatus.output = output
	const { atomUpdates } = store.transactionStatus
	store.config.logger?.info(
		`🛃 applying transaction "${store.transactionStatus.key}" with ${atomUpdates.length} updates.`,
	)
	store.config.logger?.info(`🛃 the updates are:`, atomUpdates)
	for (const { key, newValue } of atomUpdates) {
		const token: AtomToken<unknown> = { key, type: `atom` }
		if (!store.valueMap.has(token.key)) {
			if (token.family) {
				const family = store.families.get(token.family.key)
				if (family) {
					family(token.family.subKey)
				}
			} else {
				const newAtom = store.transactionStatus.core.atoms.get(token.key)
				if (!newAtom) {
					throw new Error(
						`Absurd Error: Atom "${token.key}" not found while copying updates from transaction "${store.transactionStatus.key}" to store "${store.config.name}"`,
					)
				}
				store.atoms.set(newAtom.key, newAtom)
				store.valueMap.set(newAtom.key, newAtom.default)
				store.config.logger?.info(`🔧`, `add atom "${newAtom.key}"`)
			}
		}
		// if (store.transactionStatus.key === `dealCards`) debugger
		setState(token, newValue, store)
	}
	const myTransaction = withdraw<ƒ>(
		{ key: store.transactionStatus.key, type: `transaction` },
		store,
	)
	if (myTransaction === undefined) {
		throw new Error(
			`Transaction "${store.transactionStatus.key}" not found. Absurd. How is this running?`,
		)
	}
	myTransaction.subject.next({
		key: store.transactionStatus.key,
		atomUpdates,
		output,
		params: store.transactionStatus.params as Parameters<ƒ>,
	})
	store.transactionStatus = { phase: `idle` }
	store.config.logger?.info(`🛬`, `transaction "${myTransaction.key}" applied`)
}
