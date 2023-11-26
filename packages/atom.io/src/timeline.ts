import type {
	Timeline,
	TimelineAtomUpdate,
	TimelineSelectorUpdate,
	TimelineTransactionUpdate,
} from "atom.io/internal"
import {
	IMPLICIT,
	redo__INTERNAL,
	createTimeline,
	undo__INTERNAL,
} from "atom.io/internal"

import type { AtomFamily, AtomToken } from "."

export type TimelineToken = {
	key: string
	type: `timeline`
}

export type TimelineOptions = {
	key: string
	atoms: (AtomFamily<any, any> | AtomToken<any>)[]
	shouldCapture?: (update: TimelineUpdate, timeline: Timeline) => boolean
}

export type TimelineUpdate =
	| TimelineAtomUpdate
	| TimelineSelectorUpdate
	| TimelineTransactionUpdate

export const timeline = (options: TimelineOptions): TimelineToken => {
	return createTimeline(options, IMPLICIT.STORE)
}

export const redo = (token: TimelineToken): void => {
	redo__INTERNAL(token, IMPLICIT.STORE)
}

export const undo = (token: TimelineToken): void => {
	undo__INTERNAL(token, IMPLICIT.STORE)
}
