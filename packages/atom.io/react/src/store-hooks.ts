import * as React from "react"

import { getState, redo, setState, undo } from "atom.io"
import type {
	MutableAtomToken,
	ReadableToken,
	TimelineToken,
	WritableToken,
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
	token: WritableToken<T>,
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

export function useO<T>(token: ReadableToken<T>): T {
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

export function useTL(token: TimelineToken<any>): TimelineMeta {
	const store = React.useContext(StoreContext)
	const id = React.useId()
	const timeline = withdraw(token, store)
	const tokenRef = React.useRef(token)
	const rebuildMeta = () => {
		return {
			at: timeline?.at ?? NaN,
			length: timeline?.history.length ?? NaN,
			undo: () => undo(token),
			redo: () => redo(token),
		}
	}
	const meta = React.useRef<TimelineMeta>(rebuildMeta())
	const retrieve = () => {
		if (
			meta.current.at !== timeline?.at ||
			meta.current.length !== timeline?.history.length ||
			tokenRef.current !== token
		) {
			tokenRef.current = token
			meta.current = rebuildMeta()
		}
		return meta.current
	}
	return React.useSyncExternalStore<TimelineMeta>(
		(dispatch) => subscribeToTimeline(token, dispatch, `use-tl:${id}`, store),
		retrieve,
		retrieve,
	)
}
