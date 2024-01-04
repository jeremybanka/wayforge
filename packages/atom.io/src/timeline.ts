import type {
	Timeline,
	TimelineAtomUpdate,
	TimelineSelectorUpdate,
	TimelineTransactionUpdate,
} from "atom.io/internal"
import { IMPLICIT, createTimeline, timeTravel } from "atom.io/internal"

import type { AtomFamily, AtomToken } from "."

export type TimelineManageable = AtomFamily<any, any> | AtomToken<any>

export type TimelineToken<_> = {
	key: string
	type: `timeline`
	__brand?: _
}

export type TimelineOptions<ManagedAtom extends TimelineManageable> = {
	key: string
	atoms: ManagedAtom[]
	shouldCapture?: (
		update: TimelineUpdate<ManagedAtom>,
		timeline: Timeline<TimelineManageable>,
	) => boolean
}

export type TimelineUpdate<ManagedAtom extends TimelineManageable> =
	| TimelineAtomUpdate<ManagedAtom>
	| TimelineSelectorUpdate<ManagedAtom>
	| TimelineTransactionUpdate

export const timeline = <ManagedAtom extends TimelineManageable>(
	options: TimelineOptions<ManagedAtom>,
): TimelineToken<ManagedAtom> => {
	return createTimeline(options, IMPLICIT.STORE)
}

export const redo = (timeline: TimelineToken<any>): void => {
	timeTravel(`forward`, timeline, IMPLICIT.STORE)
}

export const undo = (timeline: TimelineToken<any>): void => {
	timeTravel(`backward`, timeline, IMPLICIT.STORE)
}
