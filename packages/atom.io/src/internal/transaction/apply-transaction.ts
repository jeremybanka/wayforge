import { ingestTransactionOutcomeEvent } from "../ingest-updates"
import { newest } from "../lineage"
import type { Store } from "../store"
import { withdraw } from "../store"
import type { Fn } from "../utility-types"
import { isChildStore, isRootStore } from "./is-root-store"
import { setEpochNumberOfAction } from "./set-epoch-number"

export function applyTransaction<F extends Fn>(
	store: Store,
	output: ReturnType<F>,
): void {
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
	const { subEvents: updates } = child.transactionMeta.update
	store.logger.info(
		`🛄`,
		`transaction`,
		child.transactionMeta.update.token.key,
		`Applying transaction with ${updates.length} updates:`,
		updates,
	)

	ingestTransactionOutcomeEvent(parent, child.transactionMeta.update, `newValue`)

	if (isRootStore(parent)) {
		setEpochNumberOfAction(
			parent,
			child.transactionMeta.update.token.key,
			child.transactionMeta.update.epoch,
		)
		const myTransaction = withdraw<Fn>(store, {
			key: child.transactionMeta.update.token.key,
			type: `transaction`,
		})
		myTransaction?.subject.next(child.transactionMeta.update)
		store.logger.info(
			`🛬`,
			`transaction`,
			child.transactionMeta.update.token.key,
			`Finished applying transaction.`,
		)
	} else if (isChildStore(parent)) {
		parent.transactionMeta.update.subEvents.push(child.transactionMeta.update)
	}
	parent.on.transactionApplying.next(null)
}
