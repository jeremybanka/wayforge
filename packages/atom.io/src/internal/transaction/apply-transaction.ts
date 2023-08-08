import type { ƒn } from "~/packages/anvl/src/function"

import type { Store } from ".."
import { withdraw } from ".."
import type { AtomToken } from "../.."
import { setState } from "../.."

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
	store.config.logger?.info(
		`🛃 apply transaction "${store.transactionStatus.key}"`,
	)
	store.transactionStatus.phase = `applying`
	store.transactionStatus.output = output
	const { atomUpdates } = store.transactionStatus

	for (const { key, newValue } of atomUpdates) {
		const token: AtomToken<unknown> = { key, type: `atom` }
		if (!store.valueMap.has(token.key)) {
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
		setState(token, newValue, store)
	}
	const myTransaction = withdraw<ƒ>(
		{ key: store.transactionStatus.key, type: `transaction` },
		store,
	)
	if (myTransaction === null) {
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
	store.config.logger?.info(`🛬`, `transaction done`)
}
