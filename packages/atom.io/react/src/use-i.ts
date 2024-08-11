import type { WritableFamilyToken, WritableToken } from "atom.io"
import { setIntoStore } from "atom.io/internal"
import type { Canonical } from "atom.io/json"
import * as React from "react"

import { parseStateOverloads } from "./parse-state-overloads"
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
	const store = React.useContext(StoreContext)
	const token = parseStateOverloads(store, ...params)
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
