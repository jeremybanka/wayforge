import type {
	MoleculeCreation,
	MoleculeDisposal,
	MoleculeTransfer,
	ReadableToken,
	StateCreation,
	StateDisposal,
} from "atom.io"
import { parseJson, stringifyJson } from "atom.io/json"

import { disposeFromStore, findInStore } from "../families"
import type { Store } from "../store"
import {
	allocateIntoStore,
	claimWithinStore,
	deallocateFromStore,
} from "../molecule"

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
			if (update.subType === `atom`) {
				store.valueMap.set(update.token.key, update.value)
			}
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
	update: MoleculeCreation,
	applying: `newValue` | `oldValue`,
	store: Store,
): void {
	switch (applying) {
		case `newValue`:
			allocateIntoStore<any, any, any>(store, update.provenance, update.key)
			break

		case `oldValue`:
			deallocateFromStore<any, any>(store, update.key)
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
			deallocateFromStore<any, any>(store, update.key)
			break

		case `oldValue`:
			{
				// let first = t rue
				// for (const ownerString of update.provenance) {
				// 	// const owner = parseJson(ownerString)
				// 	// if (first) {
				// 	// 	first = false
				// 	// 	allocateIntoStore<any, any, any>(store, owner, update.key)
				// 	// 	continue
				// 	// }

				// 	// claimWithinStore<any, any, any>(store, owner, update.key)

				// }
				const provenanceJson = update.provenance.map(parseJson)
				allocateIntoStore<any, any, any>(store, provenanceJson, update.key)
				for (const [familyKey, value] of update.values) {
					const family = store.families.get(familyKey)
					if (family) {
						findInStore(store, family, update.key)
						const memberKey = `${familyKey}(${stringifyJson(update.key)})`
						store.valueMap.set(memberKey, value)
					}
				}
			}
			break
	}
}
export function ingestMoleculeTransferEvent(
	update: MoleculeTransfer,
	applying: `newValue` | `oldValue`,
	store: Store,
): void {
	switch (applying) {
		case `newValue`:
			{
				const provenance = update.to.length === 1 ? update.to[0] : update.to
				claimWithinStore<any, any, any>(
					store,
					provenance,
					update.key,
					`exclusive`,
				)
			}
			break
		case `oldValue`:
			{
				const provenance =
					update.from.length === 1 ? update.from[0] : update.from
				claimWithinStore<any, any, any>(
					store,
					provenance,
					update.key,
					`exclusive`,
				)
			}
			break
	}
}
