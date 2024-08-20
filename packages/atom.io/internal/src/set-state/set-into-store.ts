import type { WritableFamilyToken, WritableToken } from "atom.io"
import { type Canonical, stringifyJson } from "atom.io/json"

import { findInStore } from "../families"
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
	let value: New | ((oldValue: T) => New)
	if (params.length === 2) {
		token = params[0]
		value = params[1]
	} else {
		const family = params[0]
		const key = params[1]
		value = params[2]
		const maybeToken = findInStore(store, family, key)
		if (`counterfeit` in maybeToken) {
			const disposal = store.disposalTraces.buffer.find(
				(item) => item?.key === key,
			)
			store.logger.error(
				`❗`,
				family.type,
				family.key,
				`tried to set member`,
				stringifyJson(key),
				`to`,
				value,
				`but it was not found in store "${store.config.name}".`,
				disposal
					? `This state was previously disposed:\n${disposal.trace}`
					: `No previous disposal trace was found.`,
			)
			return
		}
		token = maybeToken
	}

	const rejectionTime = openOperation(token, store)
	if (rejectionTime) {
		const unsubscribe = store.on.operationClose.subscribe(
			`waiting to set "${token.key}" at T-${rejectionTime}`,
			() => {
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
	const state = withdraw(token, store)
	setAtomOrSelector(state, value, store)
	closeOperation(store)
}
