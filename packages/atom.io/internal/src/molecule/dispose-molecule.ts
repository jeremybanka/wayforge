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
	// const stringKey = stringifyJson(token.key)
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
	if (family) {
		const Formula = withdraw(family, store)
		const disposalEvent: MoleculeDisposal = {
			type: `molecule_disposal`,
			token,
			family,
			context: [...molecule.above.values()].map((m) => deposit(m)),
			familyKeys: [...molecule.tokens.values()]
				.map((t) => t.family?.key)
				.filter((k): k is string => typeof k === `string`),
		}
		if (token.family) {
			disposalEvent.family = token.family
		}
		const isTransaction =
			isChildStore(store) && store.transactionMeta.phase === `building`
		if (isTransaction) {
			store.transactionMeta.update.updates.push(disposalEvent)
		} else {
			Formula.subject.next(disposalEvent)
		}
		store.molecules.delete(molecule.stringKey)
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
	for (const join of molecule.joins.values()) {
		join.molecules.delete(molecule.stringKey)
	}
	for (const parent of molecule.above.values()) {
		parent.below.delete(molecule.stringKey)
	}
}
