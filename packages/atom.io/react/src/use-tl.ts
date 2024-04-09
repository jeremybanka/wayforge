import { redo, undo } from "atom.io"
import type { TimelineToken } from "atom.io"
import { subscribeToTimeline, withdraw } from "atom.io/internal"
import * as React from "react"

import { StoreContext } from "./store-context"

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
