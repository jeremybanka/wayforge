/** biome-ignore-all lint/correctness/useHookAtTopLevel: depends on the type of atom, which shouldn't change */
import type { ReadableFamilyToken, ReadableToken, ViewOf } from "atom.io"
import { getFromStore, subscribeToState } from "atom.io/internal"
import type { Canonical } from "atom.io/json"
import { useSingleEffect } from "atom.io/realtime-react"
import {
	useCallback,
	useContext,
	useId,
	useRef,
	useState,
	useSyncExternalStore,
} from "react"

import { parseStateOverloads } from "./parse-state-overloads"
import { StoreContext } from "./store-context"

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

	if (token.type === `mutable_atom`) {
		const [, dispatch] = useState<number>(0)
		const valueRef = useRef<ViewOf<E | T>>(getFromStore(store, token))
		useSingleEffect(() => {
			const unsub = subscribeToState<T, E>(
				store,
				token,
				`use-o:${id}`,
				({ newValue }) => {
					valueRef.current = newValue
					dispatch((c) => c + 1)
				},
			)
			return unsub
		}, [token.key])
		return valueRef.current
	}

	const sub = useCallback(
		(dispatch: () => void) =>
			subscribeToState<T, E>(store, token, `use-o:${id}`, dispatch),
		[token.key],
	)
	const get = useCallback(() => getFromStore(store, token), [token.key])
	return useSyncExternalStore<ViewOf<E | T>>(sub, get, get)
}
