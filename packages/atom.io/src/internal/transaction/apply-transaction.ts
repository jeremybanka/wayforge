import { ingestTransactionUpdate } from "../ingest-updates"
import { newest } from "../lineage"
import type { Store } from "../store"
import { withdraw } from "../store"
import type { Fn } from "../utility-types"
import { isChildStore, isRootStore } from "./is-root-store"
import { setEpochNumberOfAction } from "./set-epoch-number"

export const applyTransaction = <F extends Fn>(
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
	const { events: updates } = child.transactionMeta.update
	store.logger.info(
		`🛄`,
		`transaction`,
		child.transactionMeta.update.key,
		`Applying transaction with ${updates.length} updates:`,
		updates,
	)

	ingestTransactionUpdate(`newValue`, child.transactionMeta.update, parent)

	if (isRootStore(parent)) {
		setEpochNumberOfAction(
			parent,
			child.transactionMeta.update.key,
			child.transactionMeta.update.epoch,
		)
		const myTransaction = withdraw<F>(store, {
			key: child.transactionMeta.update.key,
			type: `transaction`,
		})
		myTransaction?.subject.next(child.transactionMeta.update)
		store.logger.info(
			`🛬`,
			`transaction`,
			child.transactionMeta.update.key,
			`Finished applying transaction.`,
		)
	} else if (isChildStore(parent)) {
		parent.transactionMeta.update.events.push(child.transactionMeta.update)
	}
	parent.on.transactionApplying.next(null)
}
