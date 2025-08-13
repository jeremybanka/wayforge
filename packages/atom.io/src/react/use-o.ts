import type { ReadableFamilyToken, ReadableToken } from "atom.io"
import type { ViewOf } from "atom.io/internal"
import { getFromStore, subscribeToState } from "atom.io/internal"
import type { Canonical } from "atom.io/json"
import * as React from "react"

import { parseStateOverloads } from "./parse-state-overloads"
import { StoreContext } from "./store-context"

export function useO<T>(token: ReadableToken<T>): ViewOf<T>

export function useO<T, K extends Canonical>(
	token: ReadableFamilyToken<T, K>,
	key: K,
): ViewOf<T>

export function useO<T, K extends Canonical>(
	...params: [ReadableFamilyToken<T, K>, K] | [ReadableToken<T>]
): ViewOf<T> {
	const store = React.useContext(StoreContext)
	const token = parseStateOverloads(store, ...params)
	const id = React.useId()
	return React.useSyncExternalStore<ViewOf<T>>(
		(dispatch) => subscribeToState(store, token, `use-o:${id}`, dispatch),
		() => getFromStore(store, token),
		() => getFromStore(store, token),
	)
}
