import {
	getState,
	type ReadableFamilyToken,
	type ReadableToken,
	type ViewOf,
} from "atom.io"
import { IMPLICIT, subscribeToState } from "atom.io/internal"
import type { Canonical } from "atom.io/json"
import { useEffect, useRef, useState } from "preact/hooks"

import { parseStateOverloads } from "./parse-state-overloads"

let subCounter = 0

export function useO<T, E>(
	token: ReadableToken<T, any, E>,
): ViewOf<E> | ViewOf<T>

export function useO<T, K extends Canonical, E>(
	token: ReadableFamilyToken<T, K, E>,
	key: NoInfer<K>,
): ViewOf<E> | ViewOf<T>

export function useO<T, K extends Canonical, E>(
	...params:
		| [ReadableFamilyToken<T, K, E>, NoInfer<K>]
		| [ReadableToken<T, any, E>]
): ViewOf<E> | ViewOf<T> {
	const token = parseStateOverloads(IMPLICIT.STORE, ...params)
	const [, forceRender] = useState<void>()
	const valueRef = useRef<ViewOf<E> | ViewOf<T>>()
	valueRef.current ??= getState(token)
	const subscriptionRef = useRef<number>()
	subscriptionRef.current ??= subCounter++
	useEffect(() => {
		const unsubscribe = subscribeToState(
			IMPLICIT.STORE,
			token,
			`use-o:${subscriptionRef.current}`,
			({ newValue }) => {
				valueRef.current = newValue
				forceRender()
			},
		)
		return unsubscribe
	}, [])
	return valueRef.current
}
