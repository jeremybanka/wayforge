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
	token: ReadableFamilyToken<T, K> | ReadableToken<T>,
	key?: K,
	// ...params:
	// 	| [ReadableFamilyToken<T, K>, K]
	// 	| [ReadableToken<T>]
): T {
	const store = React.useContext(StoreContext)
	const stateToken: ReadableToken<any> | undefined =
		token.type === `atom_family` ||
		token.type === `mutable_atom_family` ||
		token.type === `selector_family` ||
		token.type === `readonly_selector_family`
			? store.config.lifespan === `immortal`
				? seekInStore(token, key as K, store)
				: findInStore(token, key as K, store)
			: token
	if (!stateToken) {
		throw new NotFoundError(token, key, store)
	}
	const id = React.useId()
	return React.useSyncExternalStore<T>(
		(dispatch) => subscribeToState(stateToken, dispatch, `use-o:${id}`, store),
		() => getFromStore(stateToken, store),
		() => getFromStore(stateToken, store),
	)
}
