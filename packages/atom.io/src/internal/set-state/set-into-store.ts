import type { WritableFamilyToken, WritableToken } from "atom.io"
import { type Canonical, parseJson } from "atom.io/json"

import { findInStore } from "../families"
import { getFamilyOfToken } from "../families/get-family-of-token"
import { closeOperation, openOperation } from "../operation"
import type { Store } from "../store"
import { withdraw } from "../store"
import { setAtomOrSelector } from "./set-atom-or-selector"

export function setIntoStore<T, New extends T>(
	store: Store,
	token: WritableToken<T>,
	value: New | ((oldValue: T) => New),
): void

export function setIntoStore<T, K extends Canonical, New extends T>(
	store: Store,
	token: WritableFamilyToken<T, K>,
	key: K,
	value: New | ((oldValue: T) => New),
): void

export function setIntoStore<T, New extends T>(
	store: Store,
	...params:
		| [
				token: WritableFamilyToken<T, Canonical>,
				key: Canonical,
				value: New | ((oldValue: T) => New),
		  ]
		| [token: WritableToken<T>, value: New | ((oldValue: T) => New)]
): void {
	let token: WritableToken<T>
	let family: WritableFamilyToken<T, Canonical> | null
	let key: Canonical | null
	let value: New | ((oldValue: T) => New)
	if (params.length === 2) {
		token = params[0]
		value = params[1]
		if (token.family) {
			// biome-ignore lint/style/noNonNullAssertion: this token belongs to a family
			family = getFamilyOfToken(store, token)!
			key = parseJson(token.family.subKey)
			token = findInStore(store, family, key)
		}
	} else {
		family = params[0]
		key = params[1]
		value = params[2]
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
			`could not be set because it was not found in the store "${store.config.name}".`,
			disposal
				? `This state was previously disposed:\n${disposal.trace}`
				: `No previous disposal trace was found.`,
		)
		return
	}

	const rejectionTime = openOperation(store, token)
	if (rejectionTime) {
		const unsubscribe = store.on.operationClose.subscribe(
			`waiting to set "${token.key}" at T-${rejectionTime}`,
			function waitUntilOperationCloseToSetState() {
				unsubscribe()
				store.logger.info(
					`🟢`,
					token.type,
					token.key,
					`resuming deferred setState from T-${rejectionTime}`,
				)
				setIntoStore(store, token, value)
			},
		)
		return
	}
	const state = withdraw(store, token)
	setAtomOrSelector(store, state, value)
	closeOperation(store)
}
