import type { ReadableFamilyToken, ReadableToken } from "atom.io"
import {
	findInStore,
	getFromStore,
	NotFoundError,
	seekInStore,
	subscribeToState,
} from "atom.io/internal"
import type { Json } from "atom.io/json"
import * as React from "react"

import { StoreContext } from "./store-context"

export function useO<T>(token: ReadableToken<T>): T

export function useO<T, K extends Json.Serializable>(
	token: ReadableFamilyToken<T, K>,
	key: K,
): T

export function useO<T, K extends Json.Serializable>(
	...params: [ReadableFamilyToken<T, K>, K] | [ReadableToken<T>]
): T {
	const store = React.useContext(StoreContext)

	let token: ReadableToken<any>
	if (params.length === 2) {
		const family = params[0]
		const key = params[1]

		if (store.config.lifespan === `immortal`) {
			const maybeToken = seekInStore(family, key, store)
			if (!maybeToken) {
				throw new NotFoundError(family, key, store)
			}
			token = maybeToken
		} else {
			token = findInStore(family, key, store)
		}
	} else {
		token = params[0]
	}

	const id = React.useId()
	return React.useSyncExternalStore<T>(
		(dispatch) => subscribeToState(token, dispatch, `use-o:${id}`, store),
		() => getFromStore(token, store),
		() => getFromStore(token, store),
	)
}
