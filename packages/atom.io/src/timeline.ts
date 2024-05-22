import type { MoleculeFamilyToken } from "atom.io/immortal"
import type {
	Timeline,
	TimelineAtomUpdate,
	TimelineSelectorUpdate,
	TimelineStateCreation,
	TimelineStateDisposal,
	TimelineTransactionUpdate,
} from "atom.io/internal"
import { createTimeline, IMPLICIT, timeTravel } from "atom.io/internal"

import type { AtomFamilyToken, AtomToken } from "."

export type TimelineManageable = AtomFamilyToken<any, any> | AtomToken<any>
export type AtomOnly<M extends TimelineManageable> = M extends AtomFamilyToken<
	any,
	any
>
	? AtomToken<any>
	: M extends AtomToken<any>
		? M
		: never

export type TimelineToken<M> = {
	key: string
	type: `timeline`
	__M?: M
}

export type TimelineOptions<ManagedAtom extends TimelineManageable> = {
	key: string
	scope: (ManagedAtom | MoleculeFamilyToken<any, any, any>)[]
	shouldCapture?: (
		update: TimelineUpdate<ManagedAtom>,
		timeline: Timeline<TimelineManageable>,
	) => boolean
}

export type TimelineUpdate<ManagedAtom extends TimelineManageable> =
	| TimelineAtomUpdate<ManagedAtom>
	| TimelineSelectorUpdate<ManagedAtom>
	| TimelineStateCreation<AtomOnly<ManagedAtom>>
	| TimelineStateDisposal<AtomOnly<ManagedAtom>>
	| TimelineTransactionUpdate

export const timeline = <ManagedAtom extends TimelineManageable>(
	options: TimelineOptions<ManagedAtom>,
): TimelineToken<ManagedAtom> => {
	return createTimeline(options, IMPLICIT.STORE)
}

export const redo = (tl: TimelineToken<any>): void => {
	timeTravel(`redo`, tl, IMPLICIT.STORE)
}

export const undo = (tl: TimelineToken<any>): void => {
	timeTravel(`undo`, tl, IMPLICIT.STORE)
}
