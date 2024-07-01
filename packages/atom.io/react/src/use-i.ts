import type { ReadableToken, WritableFamilyToken, WritableToken } from "atom.io"
import {
	findInStore,
	NotFoundError,
	seekInStore,
	setIntoStore,
} from "atom.io/internal"
import type { Json } from "atom.io/json"
import * as React from "react"

import { StoreContext } from "./store-context"

export function useI<T>(
	token: WritableToken<T>,
): <New extends T>(next: New | ((old: T) => New)) => void

export function useI<T, K extends Json.Serializable>(
	token: WritableFamilyToken<T, K>,
	key: K,
): <New extends T>(next: New | ((old: T) => New)) => void

export function useI<T, K extends Json.Serializable>(
	token: WritableFamilyToken<T, K> | WritableToken<T>,
	key?: K,
): <New extends T>(next: New | ((old: T) => New)) => void {
	const store = React.useContext(StoreContext)
	const stateToken: ReadableToken<any> | undefined =
		token.type === `atom_family` ||
		token.type === `mutable_atom_family` ||
		token.type === `selector_family`
			? store.config.lifespan === `immortal`
				? seekInStore(token, key as K, store)
				: findInStore(token, key as K, store)
			: token
	if (!stateToken) {
		throw new NotFoundError(token, key, store)
	}
	const setter: React.MutableRefObject<
		(<New extends T>(next: New | ((old: T) => New)) => void) | null
	> = React.useRef(null)
	if (setter.current === null) {
		setter.current = (next) => {
			setIntoStore(stateToken, next, store)
		}
	}
	return setter.current
}
