import type { ReadableFamilyToken, ReadableToken } from "atom.io"
import { getFromStore, subscribeToState } from "atom.io/internal"
import type { Canonical } from "atom.io/json"
import { useContext, useId, useSyncExternalStore } from "react"

import { parseStateOverloads } from "./parse-state-overloads"
import { StoreContext } from "./store-context"

export function useO<T, E = never>(token: ReadableToken<T, any, E>): E | T

export function useO<T, K extends Canonical, E = never>(
	token: ReadableFamilyToken<T, K, E>,
	key: NoInfer<K>,
): E | T

export function useO<T, K extends Canonical, E = never>(
	...params:
		| [ReadableFamilyToken<T, K, E>, NoInfer<K>]
		| [ReadableToken<T, any, E>]
): ViewOf<E | T> {
	const store = useContext(StoreContext)
	const token = parseStateOverloads(store, ...params)
	const id = useId()
	return useSyncExternalStore<E | T>(
		(dispatch) => subscribeToState(store, token, `use-o:${id}`, dispatch),
		() => getFromStore(store, token),
		() => getFromStore(store, token),
	)
}
