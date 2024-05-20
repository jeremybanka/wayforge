import type { Func } from "atom.io"

import { disposeAtom } from "../atom"
import { initFamilyMember } from "../families"
import { ingestTransactionUpdate } from "../ingest-updates"
import { LazyMap } from "../lazy-map"
import { newest } from "../lineage"
import type { Store } from "../store"
import { withdraw } from "../store"
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
	if (child.atoms instanceof LazyMap) {
		for (const deleted of child.atoms.deleted) {
			const atom = parent.atoms.get(deleted)
			if (atom) {
				disposeAtom(atom, parent)
			}
		}
	}
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
