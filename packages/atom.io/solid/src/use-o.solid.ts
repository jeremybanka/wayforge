import type { ReadableFamilyToken, ReadableToken } from "atom.io"
import {
	arbitrary,
	getFromStore,
	IMPLICIT,
	parseStateOverloads,
	subscribeToState,
} from "atom.io/internal"
import type { Json } from "atom.io/json"

import { useSyncExternalStore } from "./use-sync-external-store.solid"

export function useO<T>(token: ReadableToken<T>): () => T

export function useO<T, K extends Json.Serializable>(
	token: ReadableFamilyToken<T, K>,
	key: K,
): () => T

export function useO<T, K extends Json.Serializable>(
	...params: [ReadableFamilyToken<T, K>, K] | [ReadableToken<T>]
): () => T {
	// const store = React.useContext(StoreContext)
	const store = IMPLICIT.STORE
	const token = parseStateOverloads(store, ...params)
	const id = arbitrary()
	return useSyncExternalStore<T>(
		(dispatch) => subscribeToState(token, dispatch, `use-o:${id}`, store),
		() => getFromStore(token, store),
	)
}
