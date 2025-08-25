import type {
	MoleculeCreationEvent,
	MoleculeDisposalEvent,
	MoleculeTransferEvent,
	ReadableToken,
	StateCreationEvent,
	StateDisposalEvent,
} from "atom.io"
import { parseJson, stringifyJson } from "atom.io/json"

import { disposeFromStore } from "../families"
import { getFromStore } from "../get-state"
import {
	allocateIntoStore,
	claimWithinStore,
	deallocateFromStore,
} from "../molecule"
import { setIntoStore } from "../set-state"
import type { Store } from "../store"

export function ingestCreationEvent(
	store: Store,
	event: StateCreationEvent<any>,
	applying: `newValue` | `oldValue`,
): void {
	switch (applying) {
		case `newValue`: {
			createInStore(store, event)
			break
		}
		case `oldValue`: {
			disposeFromStore(store, event.token)
			break
		}
	}
}

export function ingestDisposalEvent(
	store: Store,
	event: StateDisposalEvent<ReadableToken<any>>,
	applying: `newValue` | `oldValue`,
): void {
	switch (applying) {
		case `newValue`: {
			disposeFromStore(store, event.token)
			break
		}
		case `oldValue`: {
			createInStore(store, event)
			if (event.subType === `atom`) {
				store.valueMap.set(event.token.key, event.value)
			}
			break
		}
	}
}

function createInStore(
	store: Store,
	event: StateCreationEvent<any> | StateDisposalEvent<any>,
): void {
	const { token } = event
	if (event.subType === `writable` && event.value) {
		setIntoStore(store, token, event.value)
	} else {
		getFromStore(store, token)
	}
}

export function ingestMoleculeCreationEvent(
	store: Store,
	event: MoleculeCreationEvent,
	applying: `newValue` | `oldValue`,
): void {
	switch (applying) {
		case `newValue`:
			allocateIntoStore<any, any, any>(store, event.provenance, event.key)
			break

		case `oldValue`:
			deallocateFromStore<any, any>(store, event.key)
			break
	}
}
export function ingestMoleculeDisposalEvent(
	store: Store,
	event: MoleculeDisposalEvent,
	applying: `newValue` | `oldValue`,
): void {
	switch (applying) {
		case `newValue`:
			deallocateFromStore<any, any>(store, event.key)
			break

		case `oldValue`:
			{
				const provenanceJson = event.provenance.map(parseJson)
				allocateIntoStore<any, any, any>(store, provenanceJson, event.key)
				for (const [familyKey, value] of event.values) {
					const family = store.families.get(familyKey)
					if (family) {
						getFromStore(store, family, event.key)
						const memberKey = `${familyKey}(${stringifyJson(event.key)})`
						store.valueMap.set(memberKey, value)
					}
				}
			}
			break
	}
}
export function ingestMoleculeTransferEvent(
	store: Store,
	event: MoleculeTransferEvent,
	applying: `newValue` | `oldValue`,
): void {
	switch (applying) {
		case `newValue`:
			{
				for (const newOwner of event.to) {
					claimWithinStore<any, any, any>(
						store,
						newOwner,
						event.key,
						event.exclusive ? `exclusive` : undefined,
					)
				}
			}
			break
		case `oldValue`:
			{
				let exclusivity: `exclusive` | undefined = `exclusive`
				for (const previousOwner of event.from) {
					claimWithinStore<any, any, any>(
						store,
						previousOwner,
						event.key,
						exclusivity,
					)
					exclusivity = undefined
				}
			}
			break
	}
}
