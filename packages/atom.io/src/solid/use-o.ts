/** biome-ignore-all lint/correctness/useHookAtTopLevel: depends on the type of atom, which shouldn't change */
import type { ReadableFamilyToken, ReadableToken, ViewOf } from "atom.io"
import { arbitrary, getFromStore, subscribeToState } from "atom.io/internal"
import type { Canonical } from "atom.io/json"
import { useContext } from "solid-js"

import { parseStateOverloads } from "./parse-state-overloads"
import { StoreContext } from "./store-context"
import { useSyncExternalStore } from "./use-sync-external-store-solid"

export function useO<T, E = never>(
	token: ReadableToken<T, any, E>,
): () => ViewOf<E | T>

export function useO<T, K extends Canonical, E = never>(
	token: ReadableFamilyToken<T, K, E>,
	key: NoInfer<K>,
): () => ViewOf<E | T>

export function useO<T, K extends Canonical, E = never>(
	...params:
		| [ReadableFamilyToken<T, K, E>, NoInfer<K>]
		| [ReadableToken<T, any, E>]
): () => ViewOf<E | T> {
	const store = useContext(StoreContext)
	const token = parseStateOverloads(store, ...params)
	const id = arbitrary()
	const sub = (dispatch: () => void) =>
		subscribeToState<T, E>(store, token, `use-o:${id}`, dispatch)
	const get = () => getFromStore(store, token)
	return useSyncExternalStore<ViewOf<E | T>>(sub, get)
}
