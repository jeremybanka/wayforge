import type { Timeline } from "atom.io/internal"
import { createTimeline, IMPLICIT, timeTravel } from "atom.io/internal"

import type { AtomFamilyToken, AtomToken, TimelineEvent, TimelineToken } from "."

export type TimelineManageable = AtomFamilyToken<any, any> | AtomToken<any>
export type AtomOnly<M extends TimelineManageable> = M extends AtomFamilyToken<
	infer T,
	infer K
>
	? AtomToken<T, K>
	: M extends AtomToken<infer T>
		? AtomToken<T>
		: never

/**
 * If there is an update ahead of the cursor (in the future of this {@link timeline}), apply it and move the cursor to the next update
 * @param timeline - A {@link TimelineToken}
 */
export const redo = (timeline: TimelineToken<any>): void => {
	timeTravel(IMPLICIT.STORE, `redo`, timeline)
}
/**
 * Reverse the last update on the {@link timeline} and move the cursor to the previous update
 * @param timeline - A {@link TimelineToken}
 */
export const undo = (timeline: TimelineToken<any>): void => {
	timeTravel(IMPLICIT.STORE, `undo`, timeline)
}

export type TimelineOptions<ManagedAtom extends TimelineManageable> = {
	/** The unique identifier of the timeline */
	key: string
	/** The managed atoms (and families of atoms) to record */
	scope: ManagedAtom[]
	/** A function that determines whether a given update should be recorded */
	shouldCapture?: (
		update: TimelineEvent<ManagedAtom>,
		timeline: Timeline<TimelineManageable>,
	) => boolean
}

/**
 * Create a timeline, a mechanism for recording, undoing, and replaying changes to groups of atoms
 * @param options - {@link TimelineOptions}
 * @returns A reference to the timeline created: a {@link TimelineToken}
 */
export const timeline = <ManagedAtom extends TimelineManageable>(
	options: TimelineOptions<ManagedAtom>,
): TimelineToken<ManagedAtom> => {
	return createTimeline(IMPLICIT.STORE, options)
}
