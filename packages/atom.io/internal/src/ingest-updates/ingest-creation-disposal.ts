import type {
	MoleculeCreation,
	MoleculeDisposal,
	ReadableToken,
	StateCreation,
	StateDisposal,
} from "atom.io"
import { parseJson, stringifyJson } from "atom.io/json"

import { disposeFromStore, initFamilyMemberInStore } from "../families"
import { growMoleculeInStore, makeMoleculeInStore } from "../molecule"
import { type Store, withdraw } from "../store"

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
			disposeFromStore(store, update.token)
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
			disposeFromStore(store, update.token)
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
			initFamilyMemberInStore(store, family, parseJson(token.family.subKey))
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
				update.context,
				update.family,
				update.token.key,
				...update.params,
			)
			break
		case `oldValue`:
			disposeFromStore(store, update.token)
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
			disposeFromStore(store, update.token)
			break
		case `oldValue`:
			{
				const moleculeToken = makeMoleculeInStore(
					store,
					update.context,
					update.family,
					update.token.key,
				)
				for (const [familyKey, value] of update.values) {
					const memberKey = `${familyKey}(${stringifyJson(moleculeToken.key)})`
					const molecule = withdraw(moleculeToken, store)
					const alreadyCreated = molecule.tokens.has(memberKey)
					const family = store.families.get(familyKey)
					if (family && !alreadyCreated) {
						growMoleculeInStore(molecule, family, store)
					}
					store.valueMap.set(memberKey, value)
				}
			}
			break
	}
}
