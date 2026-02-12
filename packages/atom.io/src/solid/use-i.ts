import type { WritableFamilyToken, WritableToken } from "atom.io"
import { setIntoStore } from "atom.io/internal"
import type { Canonical } from "atom.io/json"
import { useContext, useRef } from "react"

import { parseStateOverloads } from "./parse-state-overloads"
import { StoreContext } from "./store-context"

export function useI<T>(
	token: WritableToken<T, any, any>,
): <New extends T>(next: New | ((old: T) => New)) => void

export function useI<T, K extends Canonical>(
	token: WritableFamilyToken<T, K, any>,
	key: NoInfer<K>,
): <New extends T>(next: New | ((old: T) => New)) => void

export function useI<T, K extends Canonical>(
	...params:
		| [WritableFamilyToken<T, K, any>, NoInfer<K>]
		| [WritableToken<T, any, any>]
): <New extends T>(next: New | ((old: T) => New)) => void {
	const store = useContext(StoreContext)
	const token = parseStateOverloads(store, ...params)
	const setter: React.RefObject<
		(<New extends T>(next: New | ((old: T) => New)) => void) | null
	> = useRef(null)
	setter.current ??= (next) => {
		setIntoStore(store, token, next)
	}
	return setter.current
}
