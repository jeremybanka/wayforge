import type { ReadableFamilyToken, ReadableToken, ViewOf } from "atom.io"
import { getFromStore, subscribeToState } from "atom.io/internal"
import type { Canonical } from "atom.io/json"
import {
	useCallback,
	useContext,
	useId,
	useRef,
	useSyncExternalStore,
} from "react"

import { parseStateOverloads } from "./parse-state-overloads"
import { StoreContext } from "./store-context"

const UNSET = Symbol(`UNSET`)

export function useO<T, E = never>(
	token: ReadableToken<T, any, E>,
): ViewOf<E | T>

export function useO<T, K extends Canonical, E = never>(
	token: ReadableFamilyToken<T, K, E>,
	key: NoInfer<K>,
): ViewOf<E | T>

export function useO<T, K extends Canonical, E = never>(
	...params:
		| [ReadableFamilyToken<T, K, E>, NoInfer<K>]
		| [ReadableToken<T, any, E>]
): ViewOf<E | T> {
	const store = useContext(StoreContext)
	const token = parseStateOverloads(store, ...params)
	const id = useId()
	const ref = useRef<ViewOf<E | T> | typeof UNSET>(UNSET)
	const sub = useCallback(
		(dispatch: () => void) =>
			subscribeToState<T, E>(
				store,
				token,
				`use-o:${id}`,
				function trapValue({ newValue }) {
					ref.current = newValue
					dispatch()
				},
			),
		[token],
	)
	const get = useCallback(() => {
		let value: ViewOf<E | T>
		if (ref.current === UNSET) {
			value = ref.current = getFromStore(store, token)
		} else {
			value = ref.current
		}
		return value
	}, [token])
	return useSyncExternalStore<ViewOf<E | T>>(sub, get, get)
}
