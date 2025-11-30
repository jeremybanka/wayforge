import type { ReadableFamilyToken, ReadableToken, ViewOf } from "atom.io"
import { getFromStore, subscribeToState } from "atom.io/internal"
import type { Canonical } from "atom.io/json"
import { useCallback, useContext, useId, useSyncExternalStore } from "react"

import { parseStateOverloads } from "./parse-state-overloads"
import { StoreContext } from "./store-context"

export function useO<T, E = never>(
	token: ReadableToken<T, any, E>,
): ViewOf<E | T>

export function useO<T, K extends Canonical, E = never>(
	token: ReadableFamilyToken<T, K, E>,
	key: NoInfer<K>,
): ViewOf<E | T>

export function useO<T, K extends Canonical, E = never>(
	...params:
		| [ReadableFamilyToken<T, K, E>, NoInfer<K>]
		| [ReadableToken<T, any, E>]
): ViewOf<E | T> {
	const store = useContext(StoreContext)
	const token = parseStateOverloads(store, ...params)
	const id = useId()
	const sub = useCallback(
		(dispatch: () => void) =>
			subscribeToState<T, E>(store, token, `use-o:${id}`, dispatch),
		[token.key],
	)
	const get = useCallback(() => getFromStore(store, token), [token.key])
	return useSyncExternalStore<ViewOf<E | T>>(sub, get, get)
}
