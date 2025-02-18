import type {
	MoleculeCreation,
	MoleculeDisposal,
	ReadableToken,
	StateCreation,
	StateDisposal,
} from "atom.io"
import { parseJson, stringifyJson } from "atom.io/json"

import {
	allocateIntoStore,
	deallocateFromStore,
} from "~/packages/atom.io/src/allocate"

import { disposeFromStore, findInStore } from "../families"
import type { Store } from "../store"

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
	update: MoleculeCreation,
	applying: `newValue` | `oldValue`,
	store: Store,
): void {
	switch (applying) {
		case `newValue`:
			allocateIntoStore<any, any, any>(store, update.provenance, update.key)
			break

		case `oldValue`:
			deallocateFromStore<any, any, any>(store, update.key)
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
			deallocateFromStore<any, any, any>(store, update.key)
			break

		case `oldValue`:
			// TODO: Handle classic vs modern molecules
			allocateIntoStore<any, any, any>(store, update.provenance, update.key)
			for (const [familyKey, value] of update.values) {
				const family = store.families.get(familyKey)
				if (family) {
					findInStore(store, family, update.key)
					const memberKey = `${familyKey}(${stringifyJson(update.key)})`
					store.valueMap.set(memberKey, value)
				}
			}
			break
	}
}
