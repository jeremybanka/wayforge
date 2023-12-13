import type {
	Timeline,
	TimelineAtomUpdate,
	TimelineSelectorUpdate,
	TimelineTransactionUpdate,
} from "atom.io/internal"
import { IMPLICIT, createTimeline, timeTravel } from "atom.io/internal"

import type { AtomFamily, AtomToken } from "."

export type TimelineToken = {
	key: string
	type: `timeline`
}

export type TimelineOptions<
	TimelineAtom extends AtomFamily<any, any> | AtomToken<any, any>,
> = {
	key: string
	atoms: TimelineAtom[]
	shouldCapture?: (
		update: TimelineUpdate<TimelineAtom>,
		timeline: Timeline<Atoms>,
	) => boolean
}

export type TimelineUpdate<
	TimelineAtom extends AtomFamily<any, any> | AtomToken<any, any>,
> =
	| TimelineAtomUpdate<
			TimelineAtom extends AtomToken<infer V>
				? V
				: TimelineAtom extends AtomFamily<infer V>
				  ? V
				  : never,
			TimelineAtom extends AtomToken<any, infer K>
				? K
				: TimelineAtom extends AtomFamily<any, any>
				  ? ReturnType<TimelineAtom>[`key`]
				  : never
	  >
	| TimelineSelectorUpdate
	| TimelineTransactionUpdate

export const timeline = <
	AtomTokens extends (AtomFamily<any, any> | AtomToken<any, any>)[],
>(
	options: TimelineOptions<AtomTokens>,
): TimelineToken => {
	return createTimeline(options, IMPLICIT.STORE)
}

export const redo = (timeline: TimelineToken): void => {
	timeTravel(`forward`, timeline, IMPLICIT.STORE)
}

export const undo = (timeline: TimelineToken): void => {
	timeTravel(`backward`, timeline, IMPLICIT.STORE)
}
