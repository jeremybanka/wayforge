import type { ReadableFamilyToken, ReadableToken } from "atom.io"
import {
	getFromStore,
	parseStateOverloads,
	subscribeToState,
} from "atom.io/internal"
import type { Canonical } from "atom.io/json"
import * as React from "react"

import { StoreContext } from "./store-context"

export function useO<T>(token: ReadableToken<T>): T

export function useO<T, K extends Canonical>(
	token: ReadableFamilyToken<T, K>,
	key: K,
): T

export function useO<T, K extends Canonical>(
	...params: [ReadableFamilyToken<T, K>, K] | [ReadableToken<T>]
): T {
	const store = React.useContext(StoreContext)
	const token = parseStateOverloads(store, ...params)
	const id = React.useId()
	return React.useSyncExternalStore<T>(
		(dispatch) => subscribeToState(token, dispatch, `use-o:${id}`, store),
		() => getFromStore(store, token),
		() => getFromStore(store, token),
	)
}
