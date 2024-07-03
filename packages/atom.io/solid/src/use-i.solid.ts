import type { WritableFamilyToken, WritableToken } from "atom.io"
import { parseStateOverloads, setIntoStore } from "atom.io/internal"
import type { Json } from "atom.io/json"
import { useContext } from "solid-js"

import { StoreContext } from "./store-context-provider.solid"

export function useI<T>(
	token: WritableToken<T>,
): <New extends T>(next: New | ((old: T) => New)) => void

export function useI<T, K extends Json.Serializable>(
	token: WritableFamilyToken<T, K>,
	key: K,
): <New extends T>(next: New | ((old: T) => New)) => void

export function useI<T, K extends Json.Serializable>(
	...params: [WritableFamilyToken<T, K>, K] | [WritableToken<T>]
): <New extends T>(next: New | ((old: T) => New)) => void {
	const store = useContext(StoreContext)
	const token = parseStateOverloads(store, ...params)
	return (next) => {
		setIntoStore(token, next, store)
	}
}
