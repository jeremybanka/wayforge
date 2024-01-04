import type { AtomToken, KeyedStateUpdate, TransactionUpdate } from "atom.io"
import { setState } from "atom.io"

import type { Store } from "../store"

export function ingestTransactionUpdate(
	transactionUpdate: TransactionUpdate<any>,
	parent: Store,
	child: Store,
): void {
	for (const update of transactionUpdate.updates) {
		if (`newValue` in update) {
			ingestAtomUpdate(update, parent, child)
		} else {
			ingestTransactionUpdate(update, parent, child)
		}
	}
}
function ingestAtomUpdate(
	update: KeyedStateUpdate<any>,
	parent: Store,
	child: Store,
): void {
	const { key, newValue } = update
	const token: AtomToken<unknown> = { key, type: `atom` }
	if (!parent.valueMap.has(token.key)) {
		if (token.family) {
			const family = parent.families.get(token.family.key)
			if (family) {
				family(token.family.subKey)
			}
		} else {
			const newAtom = child.atoms.get(token.key)
			if (!newAtom) {
				throw new Error(
					`Absurd Error: Atom "${token.key}" not found while copying updates from transaction "${child.transactionMeta?.update.key}" to store "${parent.config.name}"`,
				)
			}
			parent.atoms.set(newAtom.key, newAtom)
			parent.valueMap.set(newAtom.key, newAtom.default)
			parent.logger.info(
				`🔨`,
				`transaction`,
				child.transactionMeta?.update.key ?? `???`,
				`Adding atom "${newAtom.key}"`,
			)
		}
	}
	setState(token, newValue, parent)
}
