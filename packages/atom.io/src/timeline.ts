import type { AtomFamily, AtomToken } from "."
import type {
	TimelineAtomUpdate,
	TimelineSelectorUpdate,
	TimelineTransactionUpdate,
} from "./internal"
import { IMPLICIT } from "./internal"
import { redo__INTERNAL, timeline__INTERNAL, undo__INTERNAL } from "./internal/"

export type TimelineToken = {
	key: string
	type: `timeline`
}

export type TimelineOptions = {
	key: string
	atoms: (AtomFamily<any, any> | AtomToken<any>)[]
}

export type TimelineUpdate =
	| TimelineAtomUpdate
	| TimelineSelectorUpdate
	| TimelineTransactionUpdate

export const timeline = (options: TimelineOptions): TimelineToken => {
	return timeline__INTERNAL(options)
}

export const redo = (token: TimelineToken): void => {
	redo__INTERNAL(token, IMPLICIT.STORE)
}

export const undo = (token: TimelineToken): void => {
	undo__INTERNAL(token, IMPLICIT.STORE)
}
