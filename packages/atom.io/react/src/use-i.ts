import type { WritableFamilyToken, WritableToken } from "atom.io"
import { parseStateOverloads, setIntoStore } from "atom.io/internal"
import type { Canonical } from "atom.io/json"
import type * as React from "react"
import { useContext, useRef } from "react"

import { StoreContext } from "./store-context"

export function useI<T>(
	token: WritableToken<T>,
): <New extends T>(next: New | ((old: T) => New)) => void

export function useI<T, K extends Canonical>(
	token: WritableFamilyToken<T, K>,
	key: K,
): <New extends T>(next: New | ((old: T) => New)) => void

export function useI<T, K extends Canonical>(
	...params: [WritableFamilyToken<T, K>, K] | [WritableToken<T>]
): <New extends T>(next: New | ((old: T) => New)) => void {
	const store = useContext(StoreContext)
	const token = parseStateOverloads(store, ...params)
	const setter: React.MutableRefObject<
		(<New extends T>(next: New | ((old: T) => New)) => void) | null
	> = useRef(null)
	if (setter.current === null) {
		setter.current = (next) => {
			setIntoStore(store, token, next)
		}
	}
	return setter.current
}
