import type { AtomToken, KeyedStateUpdate, TransactionUpdate, ƒn } from "atom.io"
import { setState } from "atom.io"

import { newest } from "../lineage"
import { withdraw } from "../store"
import type { Store } from "../store"

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
function ingestTransactionUpdate(
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
	parent.subject.transactionApplying.next(child.transactionMeta)
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
	ingestTransactionUpdate(child.transactionMeta.update, parent, child)
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
	parent.subject.transactionApplying.next(null)
}
