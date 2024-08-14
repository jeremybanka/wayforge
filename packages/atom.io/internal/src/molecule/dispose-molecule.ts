import type {
	MoleculeConstructor,
	MoleculeDisposal,
	MoleculeToken,
} from "atom.io"

import { disposeFromStore } from "../families"
import type { Store } from "../store"
import { deposit, withdraw } from "../store"
import { isChildStore } from "../transaction"
import type { Molecule } from "./molecule-internal"

export function disposeMolecule<M extends MoleculeConstructor>(
	token: MoleculeToken<M>,
	store: Store,
): void {
	let molecule: Molecule<M>
	try {
		molecule = withdraw(token, store)
	} catch (thrown) {
		if (thrown instanceof Error) {
			store.logger.error(
				`🐞`,
				`molecule`,
				JSON.stringify(token.key),
				`Failed to dispose molecule, because it was not found in the store.`,
				thrown.message,
			)
		}
		return
	}
	const { family } = token

	const context: MoleculeToken<any>[] = []
	for (const above of molecule.above.values()) {
		context.push(deposit(above))
	}
	const values: [string, any][] = []
	for (const stateToken of molecule.tokens.values()) {
		// biome-ignore lint/style/noNonNullAssertion: tokens of molecules must have a family
		const tokenFamily = stateToken.family!
		values.push([tokenFamily.key, store.valueMap.get(stateToken.key)])
	}

	if (family) {
		const Formula = withdraw(family, store)
		const disposalEvent: MoleculeDisposal = {
			type: `molecule_disposal`,
			token,
			family,
			context,
			values,
		}
		if (token.family) {
			disposalEvent.family = token.family
		}
		for (const state of molecule.tokens.values()) {
			disposeFromStore(state, store)
		}
		for (const child of molecule.below.values()) {
			if (child.family?.dependsOn === `all`) {
				disposeMolecule(child, store)
			} else {
				child.above.delete(molecule.stringKey)
				if (child.above.size === 0) {
					disposeMolecule(child, store)
				}
			}
		}
		molecule.below.clear()

		const isTransaction =
			isChildStore(store) && store.transactionMeta.phase === `building`
		if (isTransaction) {
			store.transactionMeta.update.updates.push(disposalEvent)
		} else {
			Formula.subject.next(disposalEvent)
		}
		store.molecules.delete(molecule.stringKey)
	}

	for (const join of molecule.joins.values()) {
		join.molecules.delete(molecule.stringKey)
	}
	for (const parent of molecule.above.values()) {
		parent.below.delete(molecule.stringKey)
	}
}
