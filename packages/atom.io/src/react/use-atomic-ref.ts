import type {
	AtomToken,
	RegularAtomFamilyToken,
	RegularAtomToken,
} from "atom.io"
import {
	findInStore,
	getFromStore,
	setIntoStore,
	type Store,
} from "atom.io/internal"
import type { Canonical } from "atom.io/json"
import { useContext } from "react"

import { StoreContext } from "./store-context"
import { useSingleEffect } from "./use-single-effect"

const ATOMIC_REF_CLEAR_COALESCE_MS = 20

const clearTimers: WeakMap<
	Store,
	WeakMap<object, ReturnType<typeof setTimeout>>
> = new WeakMap()

function getClearTimers(
	store: Store,
): WeakMap<object, ReturnType<typeof setTimeout>> {
	let timers = clearTimers.get(store)
	if (timers === undefined) {
		timers = new WeakMap()
		clearTimers.set(store, timers)
	}
	return timers
}

function cancelPendingClear(store: Store, token: AtomToken<unknown>): void {
	const timers = getClearTimers(store)
	const timer = timers.get(token)
	if (timer) {
		clearTimeout(timer)
		timers.delete(token)
	}
}

function scheduleClear<T>(
	store: Store,
	token: AtomToken<T | null>,
	element: T | null,
): void {
	if (element === null) {
		return
	}
	const timers = getClearTimers(store)
	cancelPendingClear(store, token)
	timers.set(
		token,
		setTimeout(() => {
			if (getFromStore(store, token) === element) {
				setIntoStore(store, token, null)
			}
			timers.delete(token)
		}, ATOMIC_REF_CLEAR_COALESCE_MS),
	)
}

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

	useSingleEffect(() => {
		cancelPendingClear(store, token)
		const element = ref.current
		setIntoStore(store, token, element)
		return () => {
			scheduleClear(store, token, element)
		}
	}, [token, ref.current])
	return ref
}
