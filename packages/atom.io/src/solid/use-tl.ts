import type { TimelineToken } from "atom.io"
import { clearTimeline, redo, undo } from "atom.io"
import { arbitrary, subscribeToTimeline, withdraw } from "atom.io/internal"
import { useContext } from "solid-js"

import { StoreContext } from "./store-context"
import { useSyncExternalStore } from "./use-sync-external-store-solid"

export type TimelineMeta = {
	at: number
	length: number
	undo: () => void
	redo: () => void
	clear: () => void
}

export function useTL(token: TimelineToken<any>): () => TimelineMeta {
	const store = useContext(StoreContext)
	const id = arbitrary()
	const getSnapshot = (): TimelineMeta => {
		const timeline = withdraw(store, token)
		return {
			at: timeline.at,
			length: timeline.history.length,
			undo: () => {
				undo(token)
			},
			redo: () => {
				redo(token)
			},
			clear: () => {
				clearTimeline(token)
			},
		}
	}
	return useSyncExternalStore<TimelineMeta>((dispatch) => {
		return subscribeToTimeline(store, token, `use-tl:${id}`, dispatch)
	}, getSnapshot)
}
