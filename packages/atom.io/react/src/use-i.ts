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
	...params: [WritableFamilyToken<T, K>, K] | [WritableToken<T>]
): <New extends T>(next: New | ((old: T) => New)) => void {
	const store = React.useContext(StoreContext)

	let token: ReadableToken<any>
	if (params.length === 2) {
		const family = params[0]
		const key = params[1]

		if (store.config.lifespan === `immortal`) {
			const maybeToken = seekInStore(family, key, store)
			if (!maybeToken) {
				throw new NotFoundError(family, key, store)
			}
			token = maybeToken
		} else {
			token = findInStore(family, key, store)
		}
	} else {
		token = params[0]
	}
	const setter: React.MutableRefObject<
		(<New extends T>(next: New | ((old: T) => New)) => void) | null
	> = React.useRef(null)
	if (setter.current === null) {
		setter.current = (next) => {
			setIntoStore(token, next, store)
		}
	}
	return setter.current
}
