import { stringifyJson } from "anvl/json"
import type { ReadableToken, StateCreation, StateDisposal } from "atom.io"

import { disposeFromStore, initFamilyMember } from "../families"
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
			const molecule = store.molecules.get(stringifyJson(token.family.subKey))
			if (molecule) {
				molecule.bond(family)
				return
			}
			if (store.config.lifespan === `immortal`) {
				throw new Error(
					`No molecule found for key "${stringifyJson(token.family.subKey)}"`,
				)
			}
			initFamilyMember(family, token.family.subKey, store)
		}
	}
}
