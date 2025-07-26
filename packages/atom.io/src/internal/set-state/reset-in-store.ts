import type { WritableFamilyToken, WritableToken } from "atom.io"
import { type Canonical, parseJson } from "atom.io/json"

import { findInStore } from "../families"
import { getFamilyOfToken } from "../families/get-family-of-token"
import { closeOperation, openOperation } from "../operation"
import type { Store } from "../store"
import { withdraw } from "../store"
import { resetAtomOrSelector } from "./reset-atom-or-selector"

export function resetInStore(store: Store, token: WritableToken<any>): void

export function resetInStore<K extends Canonical>(
	store: Store,
	token: WritableFamilyToken<any, K>,
	key: K,
): void

export function resetInStore<T>(
	store: Store,
	...params:
		| [token: WritableFamilyToken<T, Canonical>, key: Canonical]
		| [token: WritableToken<T>]
): void {
	let token: WritableToken<T>
	let family: WritableFamilyToken<T, Canonical> | null
	let key: Canonical | null
	if (params.length === 1) {
		token = params[0]
		family = getFamilyOfToken(store, token) ?? null
		if (family) {
			key = token.family ? parseJson(token.family.subKey) : null
			token = findInStore(store, family, key)
		}
	} else {
		family = params[0]
		key = params[1]
		token = findInStore(store, family, key)
	}

	if (`counterfeit` in token && `family` in token) {
		const subKey = token.family.subKey
		const disposal = store.disposalTraces.buffer.find(
			(item) => item?.key === subKey,
		)
		store.logger.error(
			`❌`,
			token.type,
			token.key,
			`could not be reset because it was not found in the store "${store.config.name}".`,
			disposal
				? `This state was previously disposed:\n${disposal.trace}`
				: `No previous disposal trace was found.`,
		)
		return
	}

	const rejectionTime = openOperation(store, token)
	if (rejectionTime) {
		const unsubscribe = store.on.operationClose.subscribe(
			`waiting to reset "${token.key}" at T-${rejectionTime}`,
			() => {
				unsubscribe()
				store.logger.info(
					`🟢`,
					token.type,
					token.key,
					`resuming deferred resetState from T-${rejectionTime}`,
				)
				resetInStore(store, token)
			},
		)
		return
	}
	const state = withdraw(store, token)
	resetAtomOrSelector(store, state)
	closeOperation(store)
}
