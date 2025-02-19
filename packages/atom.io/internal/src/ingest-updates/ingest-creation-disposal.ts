import type {
	MoleculeCreation,
	MoleculeDisposal,
	ReadableToken,
	StateCreation,
	StateDisposal,
} from "atom.io"
import { allocateIntoStore, deallocateFromStore } from "atom.io"
import { parseJson, stringifyJson } from "atom.io/json"

import { disposeFromStore, findInStore } from "../families"
import { growMoleculeInStore, makeMoleculeInStore } from "../molecule"
import { type Store, withdraw } from "../store"

export function ingestCreationEvent(
	update: StateCreation<any>,
	applying: `newValue` | `oldValue`,
	store: Store,
): void {
	switch (applying) {
		case `newValue`: {
			createInStore(update, store)
			break
		}
		case `oldValue`: {
			disposeFromStore(store, update.token)
			break
		}
	}
}

export function ingestDisposalEvent(
	update: StateDisposal<ReadableToken<any>>,
	applying: `newValue` | `oldValue`,
	store: Store,
): void {
	switch (applying) {
		case `newValue`: {
			disposeFromStore(store, update.token)
			break
		}
		case `oldValue`: {
			createInStore(update, store)
			store.valueMap.set(update.token.key, update.value)
			break
		}
	}
}

function createInStore(
	update: StateCreation<any> | StateDisposal<any>,
	store: Store,
): void {
	const { family: familyMeta } = update.token
	if (familyMeta) {
		const family = store.families.get(familyMeta.key)
		if (family) {
			findInStore(store, family, parseJson(familyMeta.subKey))
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
			switch (update.subType) {
				case `classic`:
					makeMoleculeInStore(
						store,
						update.context,
						update.family,
						update.token.key,
						...update.params,
					)
					break
				case `modern`:
					allocateIntoStore<any, any, any>(store, update.provenance, update.key)
					break
			}
			break
		case `oldValue`:
			switch (update.subType) {
				case `classic`:
					disposeFromStore(store, update.token)
					break
				case `modern`:
					deallocateFromStore<any, any, any>(store, update.key)
					break
			}
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
			switch (update.subType) {
				case `classic`:
					disposeFromStore(store, update.token)
					break
				case `modern`:
					deallocateFromStore<any, any, any>(store, update.key)
					break
			}
			break
		case `oldValue`:
			{
				// TODO: Handle classic vs modern molecules
				switch (update.subType) {
					case `classic`:
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
					case `modern`: {
						allocateIntoStore<any, any, any>(
							store,
							update.provenance,
							update.key,
						)
						for (const [familyKey, value] of update.values) {
							const family = store.families.get(familyKey)
							if (family) {
								findInStore(store, family, update.key)
								const memberKey = `${familyKey}(${stringifyJson(update.key)})`
								store.valueMap.set(memberKey, value)
							}
						}
					}
				}
			}
			break
	}
}
