import * as React from "react"

import { getState, setState, subscribe } from "atom.io"
import type { ReadonlySelectorToken, StateToken } from "atom.io"

import { StoreContext } from "./store-context"

export function useI<T>(
	token: StateToken<T>,
): <New extends T>(next: New | ((old: T) => New)) => void {
	const store = React.useContext(StoreContext)
	return (next) => setState(token, next, store)
}

export function useO<T>(token: ReadonlySelectorToken<T> | StateToken<T>): T {
	const store = React.useContext(StoreContext)
	const id = React.useId()
	return React.useSyncExternalStore<T>(
		(dispatch) => subscribe(token, dispatch, `use-o:${id}`, store),
		() => getState(token, store),
	)
}
