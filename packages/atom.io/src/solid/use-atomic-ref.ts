import type {
	AtomToken,
	RegularAtomFamilyToken,
	RegularAtomToken,
} from "atom.io"
import { findInStore, setIntoStore } from "atom.io/internal"
import type { Canonical } from "atom.io/json"
import { useContext, useEffect } from "react"

import { StoreContext } from "./store-context"

export function useAtomicRef<T, R extends { current: T | null }>(
	token: RegularAtomToken<T | null>,
	useRef: <TT>(initialValue: TT | null) => R,
): R

export function useAtomicRef<
	T,
	K extends Canonical,
	R extends { current: T | null },
>(
	token: RegularAtomFamilyToken<T | null, K>,
	key: NoInfer<K>,
	useRef: <TT>(initialValue: TT | null) => R,
): R

export function useAtomicRef<
	T,
	K extends Canonical,
	R extends { current: T | null },
>(
	...params:
		| [
				RegularAtomFamilyToken<T | null, K>,
				NoInfer<K>,
				<TT>(initialValue: TT | null) => R,
		  ]
		| [RegularAtomToken<T | null>, <TT>(initialValue: TT | null) => R]
): R {
	let token: AtomToken<T | null>
	let useRef: <TT>(initialValue: TT | null) => R
	const store = useContext(StoreContext)
	if (params.length === 3) {
		const family = params[0]
		const key = params[1]
		token = findInStore(store, family, key)
		useRef = params[2]
	} else {
		token = params[0]
		useRef = params[1]
	}
	const ref = useRef(null)
	useEffect(() => {
		setIntoStore(store, token, ref.current)
	}, [token])
	return ref
}
