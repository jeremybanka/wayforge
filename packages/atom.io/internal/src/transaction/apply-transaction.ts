import type { ƒn } from "atom.io"

import { ingestTransactionUpdate } from "../ingest-updates"
import { newest } from "../lineage"
import { withdraw } from "../store"
import type { Store } from "../store"

export const applyTransaction = <ƒ extends ƒn>(
	output: ReturnType<ƒ>,
	store: Store,
): void => {
	const child = newest(store)
	const { parent } = child
	if (
		parent === null ||
		child.transactionMeta === null ||
		child.transactionMeta?.phase !== `building`
	) {
		store.logger.warn(
			`🐞`,
			`transaction`,
			`???`,
			`applyTransaction called outside of a transaction. This is probably a bug in AtomIO.`,
		)
		return
	}
	child.transactionMeta.phase = `applying`
	child.transactionMeta.update.output = output
	parent.child = null
	parent.on.transactionApplying.next(child.transactionMeta)
	const { updates } = child.transactionMeta.update
	store.logger.info(
		`🛄`,
		`transaction`,
		child.transactionMeta.update.key,
		`Applying transaction with ${updates.length} updates:`,
		updates,
	)
	for (const tracker of child.trackers.values()) {
		const mutableKey = tracker.mutableState.key
		if (!parent.atoms.has(mutableKey)) {
			const atom = child.atoms.get(mutableKey)
			atom?.install(parent)
		}
		tracker.dispose()
	}
	for (const atom of child.atoms.values()) {
		if (!parent.atoms.has(atom.key)) {
			parent.atoms.set(atom.key, atom)
			parent.valueMap.set(atom.key, atom.default)
			parent.logger.info(
				`🔨`,
				`transaction`,
				child.transactionMeta.update.key,
				`Adding atom "${atom.key}"`,
			)
		}
	}
	ingestTransactionUpdate(`newValue`, child.transactionMeta.update, parent)
	if (parent.transactionMeta === null) {
		const myTransaction = withdraw<ƒ>(
			{ key: child.transactionMeta.update.key, type: `transaction` },
			store,
		)
		myTransaction?.subject.next(child.transactionMeta.update)
		store.logger.info(
			`🛬`,
			`transaction`,
			child.transactionMeta.update.key,
			`Finished applying transaction.`,
		)
	} else {
		parent.transactionMeta.update.updates.push(child.transactionMeta.update)
	}
	parent.on.transactionApplying.next(null)
}
