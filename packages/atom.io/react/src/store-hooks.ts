import * as React from "react"

import { getState, redo, setState, undo } from "atom.io"
import type {
	MutableAtomFamilyToken,
	MutableAtomToken,
	ReadableFamilyToken,
	ReadableToken,
	TimelineToken,
	WritableFamilyToken,
	WritableToken,
} from "atom.io"

import {
	findInStore,
	getJsonToken,
	subscribeToState,
	subscribeToTimeline,
	withdraw,
} from "atom.io/internal"
import type { Json } from "atom.io/json"
import { StoreContext } from "./store-context"

export function useI<T>(
	token: WritableToken<T>,
): <New extends T>(next: New | ((old: T) => New)) => void

export function useI<T, K extends Json.Serializable>(
	token: WritableFamilyToken<T, K>,
	key: K,
): <New extends T>(next: New | ((old: T) => New)) => void

export function useI<T, K extends Json.Serializable>(
	token: WritableFamilyToken<T, K> | WritableToken<T>,
	key?: K,
): <New extends T>(next: New | ((old: T) => New)) => void {
	const store = React.useContext(StoreContext)
	const stateToken: ReadableToken<any> =
		token.type === `atom_family` ||
		token.type === `mutable_atom_family` ||
		token.type === `selector_family`
			? findInStore(token, key as K, store)
			: token
	const setter: React.MutableRefObject<
		(<New extends T>(next: New | ((old: T) => New)) => void) | null
	> = React.useRef(null)
	if (setter.current === null) {
		setter.current = (next) => setState(stateToken, next, store)
	}
	return setter.current
}

export function useO<T>(token: ReadableToken<T>): T

export function useO<T, K extends Json.Serializable>(
	token: ReadableFamilyToken<T, K>,
	key: K,
): T

export function useO<T, K extends Json.Serializable>(
	token: ReadableFamilyToken<T, K> | ReadableToken<T>,
	key?: K,
): T {
	const store = React.useContext(StoreContext)
	const stateToken: ReadableToken<any> =
		token.type === `atom_family` ||
		token.type === `mutable_atom_family` ||
		token.type === `selector_family` ||
		token.type === `readonly_selector_family`
			? findInStore(token, key as K, store)
			: token
	const id = React.useId()
	return React.useSyncExternalStore<T>(
		(dispatch) => subscribeToState(stateToken, dispatch, `use-o:${id}`, store),
		() => getState(stateToken, store),
		() => getState(stateToken, store),
	)
}

export function useJSON<Serializable extends Json.Serializable>(
	token: MutableAtomToken<any, Serializable>,
): Serializable

export function useJSON<
	Serializable extends Json.Serializable,
	Key extends Serializable,
>(token: MutableAtomFamilyToken<any, Serializable, Key>, key: Key): Serializable

export function useJSON<
	Serializable extends Json.Serializable,
	Key extends Serializable,
>(
	token:
		| MutableAtomFamilyToken<any, Serializable, Key>
		| MutableAtomToken<any, Serializable>,
	key?: Key,
): Serializable {
	const store = React.useContext(StoreContext)
	const stateToken: ReadableToken<any> =
		token.type === `mutable_atom_family`
			? findInStore(token, key as Key, store)
			: token
	const jsonToken = getJsonToken(stateToken)
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
