import type { ReadableFamilyToken, ReadableToken } from "atom.io"
import { getFromStore, subscribeToState } from "atom.io/internal"
import type { Canonical } from "atom.io/json"
import * as React from "react"

import { parseStateOverloads } from "./parse-state-overloads"
import { StoreContext } from "./store-context"

export function useO<T, E>(token: ReadableToken<T, any, E>): E | T

export function useO<T, K extends Canonical, Key extends K, E>(
	token: ReadableFamilyToken<T, K, E>,
	key: Key,
): E | T

export function useO<T, K extends Canonical, Key extends K, E>(
	...params: [ReadableFamilyToken<T, K, E>, Key] | [ReadableToken<T, any, E>]
): E | T {
	const store = React.useContext(StoreContext)
	const token = parseStateOverloads(store, ...params)
	const id = React.useId()
	return React.useSyncExternalStore<E | T>(
		(dispatch) => subscribeToState(store, token, `use-o:${id}`, dispatch),
		() => getFromStore(store, token),
		() => getFromStore(store, token),
	)
}
