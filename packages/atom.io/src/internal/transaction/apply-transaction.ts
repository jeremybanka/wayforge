import { ingestTransactionOutcomeEvent } from "../events"
import { newest } from "../lineage"
import { withdraw } from "../store"
import type { Fn } from "../utility-types"
import type { ChildStore } from "./is-root-store"
import { isChildStore, isRootStore } from "./is-root-store"
import { setEpochNumberOfAction } from "./set-epoch-number"

export function applyTransaction<F extends Fn>(
	store: ChildStore,
	output: ReturnType<F>,
): void {
	const child = newest(store)
	const { parent } = child

	child.transactionMeta.phase = `applying`
	child.transactionMeta.update.output = output
	parent.child = null
	parent.on.transactionApplying.next(child.transactionMeta)
	const { subEvents: updates } = child.transactionMeta.update
	store.logger.info(
		`🛄`,
		`transaction`,
		child.transactionMeta.update.token.key,
		`applying ${updates.length} subEvents:`,
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
			`applied`,
		)
	} else if (isChildStore(parent)) {
		parent.transactionMeta.update.subEvents.push(child.transactionMeta.update)
	}
	parent.on.transactionApplying.next(null)
}
