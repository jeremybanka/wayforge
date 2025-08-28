import type { WritableFamilyToken, WritableToken } from "atom.io"
import { setIntoStore } from "atom.io/internal"
import type { Canonical } from "atom.io/json"
import * as React from "react"

import { parseStateOverloads } from "./parse-state-overloads"
import { StoreContext } from "./store-context"

export function useI<T, E>(
	token: WritableToken<T, any, E>,
): <New extends T>(next: New | ((old: T) => New)) => void

export function useI<T, K extends Canonical, Key extends K, E>(
	token: WritableFamilyToken<T, K, E>,
	key: Key,
): <New extends T>(next: New | ((old: T) => New)) => void

export function useI<T, K extends Canonical, Key extends K, E>(
	...params: [WritableFamilyToken<T, K, E>, Key] | [WritableToken<T, any, E>]
): <New extends T>(next: New | ((old: T) => New)) => void {
	const store = React.useContext(StoreContext)
	const token = parseStateOverloads(store, ...params)
	const setter: React.RefObject<
		(<New extends T>(next: New | ((old: T) => New)) => void) | null
	> = React.useRef(null)
	setter.current ??= (next) => {
		setIntoStore(store, token, next)
	}
	return setter.current
}
