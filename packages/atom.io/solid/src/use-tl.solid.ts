import type { TimelineToken } from "atom.io"
import {
	arbitrary,
	subscribeToTimeline,
	timeTravel,
	withdraw,
} from "atom.io/internal"
import { createEffect, createSignal, onCleanup, useContext } from "solid-js"

import { StoreContext } from "./store-context-provider.solid"
import { useSyncExternalStore } from "./use-sync-external-store.solid"

export type TimelineMeta = {
	at: () => number
	length: () => number
	undo: () => void
	redo: () => void
}

export function useTL(token: TimelineToken<any>): TimelineMeta {
	const store = useContext(StoreContext)
	const id = arbitrary()
	const tl = withdraw(token, store)
	const undo = () => {
		timeTravel(`undo`, token, store)
	}
	const redo = () => {
		timeTravel(`redo`, token, store)
	}

	const [at, setAt] = createSignal(tl.at)
	const [length, setLength] = createSignal(tl.history.length)

	createEffect(() => {
		const update = () => {
			setAt(tl.at)
			setLength(tl.history.length)
		}
		const unsubscribeFromTimeline = subscribeToTimeline(
			token,
			update,
			`use-tl:${id}`,
			store,
		)

		update()

		onCleanup(() => {
			unsubscribeFromTimeline()
		})
	})

	return { at, length, undo, redo }
}
