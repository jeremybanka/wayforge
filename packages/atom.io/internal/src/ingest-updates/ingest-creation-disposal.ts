import { parseJson } from "anvl/json"
import type {
	MoleculeCreation,
	MoleculeDisposal,
	ReadableToken,
	StateCreation,
	StateDisposal,
} from "atom.io"
import {
	disposeMolecule,
	growMoleculeInStore,
	makeMoleculeInStore,
} from "atom.io/immortal"

import { disposeFromStore, initFamilyMemberInStore } from "../families"
import type { Store } from "../store"

export function ingestCreationEvent(
	update: StateCreation<any>,
	applying: `newValue` | `oldValue`,
	store: Store,
): void {
	switch (applying) {
		case `newValue`: {
			createInStore(update.token, store)
			break
		}
		case `oldValue`: {
			disposeFromStore(update.token, store)
			break
		}
	}
}

export function ingestDisposalEvent(
	update: StateDisposal<any>,
	applying: `newValue` | `oldValue`,
	store: Store,
): void {
	switch (applying) {
		case `newValue`: {
			disposeFromStore(update.token, store)
			break
		}
		case `oldValue`: {
			createInStore(update.token, store)
			store.valueMap.set(update.token.key, update.value)
			break
		}
	}
}

function createInStore(token: ReadableToken<any>, store: Store): void {
	if (token.family) {
		const family = store.families.get(token.family.key)
		if (family) {
			const molecule = store.molecules.get(token.family.subKey)
			if (molecule) {
				growMoleculeInStore(molecule, family, store)
				return
			}
			if (store.config.lifespan === `immortal`) {
				throw new Error(`No molecule found for key "${token.family.subKey}"`)
			}
			initFamilyMemberInStore(family, parseJson(token.family.subKey), store)
		}
	}
}

export function ingestMoleculeCreationEvent(
	update: MoleculeCreation<any>,
	applying: `newValue` | `oldValue`,
	store: Store,
): void {
	switch (applying) {
		case `newValue`:
			makeMoleculeInStore(
				store,
				update.context[0],
				update.family,
				update.token.key,
				...update.params,
			)
			break
		case `oldValue`:
			disposeMolecule(update.token, store)
			break
	}
}
export function ingestMoleculeDisposalEvent(
	update: MoleculeDisposal,
	applying: `newValue` | `oldValue`,
	store: Store,
): void {
	switch (applying) {
		case `newValue`:
			disposeMolecule(update.token, store)
			break
		case `oldValue`:
			makeMoleculeInStore(
				store,
				update.context[0],
				update.family,
				update.token.key,
			)
			break
	}
}
