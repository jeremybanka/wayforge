import * as React from "react"

import { getState, redo, setState, undo } from "atom.io"
import type {
	MutableAtomToken,
	ReadonlySelectorToken,
	StateToken,
	TimelineToken,
} from "atom.io"

import {
	getJsonToken,
	subscribeToState,
	subscribeToTimeline,
	withdraw,
} from "atom.io/internal"
import type { Json } from "atom.io/json"
import { StoreContext } from "./store-context"

export function useI<T>(
	token: StateToken<T>,
): <New extends T>(next: New | ((old: T) => New)) => void {
	const store = React.useContext(StoreContext)
	const setter: React.MutableRefObject<
		(<New extends T>(next: New | ((old: T) => New)) => void) | null
	> = React.useRef(null)
	if (setter.current === null) {
		setter.current = (next) => setState(token, next, store)
	}
	return setter.current
}

export function useO<T>(token: ReadonlySelectorToken<T> | StateToken<T>): T {
	const store = React.useContext(StoreContext)
	const id = React.useId()
	return React.useSyncExternalStore<T>(
		(dispatch) => subscribeToState(token, dispatch, `use-o:${id}`, store),
		() => getState(token, store),
		() => getState(token, store),
	)
}

export function useJSON<Serializable extends Json.Serializable>(
	token: MutableAtomToken<any, Serializable>,
): Serializable {
	const jsonToken = getJsonToken(token)
	return useO(jsonToken)
}

export type TimelineMeta = {
	at: number
	length: number
	undo: () => void
	redo: () => void
}

export function useTL(token: TimelineToken): TimelineMeta {
	const store = React.useContext(StoreContext)
	const id = React.useId()
	const timeline = withdraw(token, store)
	const base = React.useRef({
		undo: () => undo(token),
		redo: () => redo(token),
	})
	const rebuildMeta = React.useCallback(() => {
		return Object.assign(
			{
				at: timeline?.at ?? NaN,
				length: timeline?.history.length ?? NaN,
			},
			base.current,
		)
	}, [])
	const meta = React.useRef<TimelineMeta>(rebuildMeta())
	const retrieve = React.useCallback(() => {
		if (
			meta.current.at !== timeline?.at ||
			meta.current.length !== timeline?.history.length
		) {
			meta.current = rebuildMeta()
		}
		return meta.current
	}, [])
	return React.useSyncExternalStore<TimelineMeta>(
		(dispatch) => subscribeToTimeline(token, dispatch, `use-tl:${id}`, store),
		retrieve,
		retrieve,
	)
}
