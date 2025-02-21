import { ingestTransactionUpdate } from "../ingest-updates"
import { newest } from "../lineage"
import type { Store } from "../store"
import { withdraw } from "../store"
import type { Func } from "../utility-types"
import { isChildStore, isRootStore } from "./is-root-store"
import { setEpochNumberOfAction } from "./set-epoch-number"

export const applyTransaction = <F extends Func>(
	output: ReturnType<F>,
	store: Store,
): void => {
	const child = newest(store)
	const { parent } = child
	if (
		parent === null ||
		!isChildStore(child) ||
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

	if (child.transactionMeta.update.key === `deleteDocument`) debugger
	ingestTransactionUpdate(`newValue`, child.transactionMeta.update, parent)

	if (isRootStore(parent)) {
		setEpochNumberOfAction(
			child.transactionMeta.update.key,
			child.transactionMeta.update.epoch,
			parent,
		)
		const myTransaction = withdraw<F>(
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
	} else if (isChildStore(parent)) {
		parent.transactionMeta.update.updates.push(child.transactionMeta.update)
	}
	parent.on.transactionApplying.next(null)
}
