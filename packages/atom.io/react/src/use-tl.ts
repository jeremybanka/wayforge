import type { TimelineToken } from "atom.io"
import { redo, undo } from "atom.io"
import { subscribeToTimeline, withdraw } from "atom.io/internal"
import { useContext, useId, useRef, useSyncExternalStore } from "react"

import { StoreContext } from "./store-context"

export type TimelineMeta = {
	at: number
	length: number
	undo: () => void
	redo: () => void
}

export function useTL(token: TimelineToken<any>): TimelineMeta {
	const store = useContext(StoreContext)
	const id = useId()
	const timeline = withdraw(token, store)
	const tokenRef = useRef(token)
	const rebuildMeta = () => {
		return {
			at: timeline.at,
			length: timeline.history.length,
			undo: () => {
				undo(token)
			},
			redo: () => {
				redo(token)
			},
		}
	}
	const meta = useRef<TimelineMeta>(rebuildMeta())
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
	return useSyncExternalStore<TimelineMeta>(
		(dispatch) => subscribeToTimeline(token, dispatch, `use-tl:${id}`, store),
		retrieve,
		retrieve,
	)
}
