import type { WritableFamilyToken, WritableToken } from "atom.io"
import type { Json } from "atom.io/json"

import { seekInStore } from "../families"
import { NotFoundError } from "../not-found-error"
import { closeOperation, openOperation } from "../operation"
import type { Store } from "../store"
import { withdraw } from "../store"
import { setAtomOrSelector } from "./set-atom-or-selector"

export function setIntoStore<T, New extends T>(
	token: WritableToken<T>,
	value: New | ((oldValue: T) => New),
	store: Store,
): void

export function setIntoStore<T, K extends Json.Serializable, New extends T>(
	token: WritableFamilyToken<T, K>,
	key: K,
	value: New | ((oldValue: T) => New),
	store: Store,
): void

export function setIntoStore<T, New extends T>(
	...params:
		| [
				token: WritableFamilyToken<T, Json.Serializable>,
				key: Json.Serializable,
				value: New | ((oldValue: T) => New),
				store: Store,
		  ]
		| [
				token: WritableToken<T>,
				value: New | ((oldValue: T) => New),
				store: Store,
		  ]
): void {
	let token: WritableToken<T>
	let value: New | ((oldValue: T) => New)
	let store: Store
	if (params.length === 3) {
		token = params[0]
		value = params[1]
		store = params[2]
	} else {
		const family = params[0]
		const key = params[1]
		value = params[2]
		store = params[3]
		const maybeToken = seekInStore(family, key, store)
		if (!maybeToken) {
			throw new NotFoundError(family, key, store)
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
				setIntoStore(token, value, store)
			},
		)
		return
	}
	const state = withdraw(token, store)
	setAtomOrSelector(state, value, store)
	closeOperation(store)
}
