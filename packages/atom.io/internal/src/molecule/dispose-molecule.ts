import type {
	MoleculeConstructor,
	MoleculeDisposal,
	MoleculeDisposalClassic,
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
	molecule = withdraw(token, store)
	const { family } = token

	for (const join of molecule.joins.values()) {
		join.relations.delete(molecule.key)
		join.molecules.delete(molecule.stringKey)
	}

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
		const disposalEvent: MoleculeDisposalClassic = {
			type: `molecule_disposal`,
			subType: `classic`,
			token,
			family,
			context,
			values,
		}
		if (token.family) {
			disposalEvent.family = token.family
		}
		for (const state of molecule.tokens.values()) {
			disposeFromStore(store, state)
		}
		for (const child of molecule.below.values()) {
			if (child.dependsOn === `all`) {
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

	for (const parent of molecule.above.values()) {
		parent.below.delete(molecule.stringKey)
	}
}
