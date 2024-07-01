import type { ReadableFamilyToken, ReadableToken } from "atom.io"
import { getFromStore, subscribeToState } from "atom.io/internal"
import type { Json } from "atom.io/json"
import * as React from "react"

import { parseStateOverloads } from "./parse-state-overloads"
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
	const token = parseStateOverloads(store, ...params)
	const id = React.useId()
	return React.useSyncExternalStore<T>(
		(dispatch) => subscribeToState(token, dispatch, `use-o:${id}`, store),
		() => getFromStore(token, store),
		() => getFromStore(token, store),
	)
}
