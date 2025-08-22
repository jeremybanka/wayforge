import type {
	MoleculeCreationEvent,
	MoleculeDisposalEvent,
	MoleculeTransferEvent,
	StateCreationEvent,
	StateDisposalEvent,
} from "atom.io"
import { parseJson, stringifyJson } from "atom.io/json"

import { disposeFromStore } from "../families"
import { mintInStore, MUST_CREATE } from "../families/mint-in-store"
import {
	allocateIntoStore,
	claimWithinStore,
	deallocateFromStore,
} from "../molecule"
import type { Store } from "../store"

export function ingestCreationEvent(
	update: StateCreationEvent,
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
	update: StateDisposalEvent,
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
	update: StateCreationEvent | StateDisposalEvent,
	store: Store,
): void {
	const { family: familyMeta } = update.token
	if (familyMeta) {
		const family = store.families.get(familyMeta.key)
		if (family) {
			mintInStore(store, family, parseJson(familyMeta.subKey), MUST_CREATE)
		}
	}
}

export function ingestMoleculeCreationEvent(
	update: MoleculeCreationEvent,
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
	update: MoleculeDisposalEvent,
	applying: `newValue` | `oldValue`,
	store: Store,
): void {
	switch (applying) {
		case `newValue`:
			deallocateFromStore<any, any>(store, update.key)
			break

		case `oldValue`:
			{
				const provenanceJson = update.provenance.map(parseJson)
				allocateIntoStore<any, any, any>(store, provenanceJson, update.key)
				for (const [familyKey, value] of update.values) {
					const family = store.families.get(familyKey)
					if (family) {
						mintInStore(store, family, update.key, MUST_CREATE)
						const memberKey = `${familyKey}(${stringifyJson(update.key)})`
						store.valueMap.set(memberKey, value)
					}
				}
			}
			break
	}
}
export function ingestMoleculeTransferEvent(
	update: MoleculeTransferEvent,
	applying: `newValue` | `oldValue`,
	store: Store,
): void {
	switch (applying) {
		case `newValue`:
			{
				for (const newOwner of update.to) {
					claimWithinStore<any, any, any>(
						store,
						newOwner,
						update.key,
						update.exclusive ? `exclusive` : undefined,
					)
				}
			}
			break
		case `oldValue`:
			{
				let exclusivity: `exclusive` | undefined = `exclusive`
				for (const previousOwner of update.from) {
					claimWithinStore<any, any, any>(
						store,
						previousOwner,
						update.key,
						exclusivity,
					)
					exclusivity = undefined
				}
			}
			break
	}
}
