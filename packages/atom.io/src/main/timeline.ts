import {
	clearTimelineInStore,
	createTimeline,
	IMPLICIT,
	timeTravel,
} from "atom.io/internal"

import type { AtomFamilyToken, AtomToken, TimelineToken } from "."

export type TimelineManageable =
	| AtomFamilyToken<any, any, any>
	| AtomToken<any, any, any>
export type AtomOnly<M extends TimelineManageable> =
	M extends AtomFamilyToken<any, any>
		? AtomToken<any, any, any>
		: M extends AtomToken<any, any, any>
			? M
			: never

/**
 * If there is an update ahead of the cursor (in the future of this {@link timelineToken}), apply it and move the cursor to the next update
 * @param timelineToken - A {@link TimelineToken}
 */
export function redo(timelineToken: TimelineToken<any>): void {
	timeTravel(IMPLICIT.STORE, `redo`, timelineToken)
}
/**
 * Reverse the last update on the {@link timelineToken} and move the cursor to the previous update
 * @param timelineToken - A {@link TimelineToken}
 */
export function undo(timelineToken: TimelineToken<any>): void {
	timeTravel(IMPLICIT.STORE, `undo`, timelineToken)
}
/**
 * Remove all recorded history from the {@link timelineToken} and reset its cursor to the beginning
 * @param timelineToken - A {@link TimelineToken}
 */
export function clearTimeline(timelineToken: TimelineToken<any>): void {
	clearTimelineInStore(IMPLICIT.STORE, timelineToken)
}

export type TimelineOptions<ManagedAtom extends TimelineManageable> = {
	/** The unique identifier of the timeline */
	key: string
	/** The managed atoms (and families of atoms) to record */
	scope: ManagedAtom[]
}

/**
 * Create a timeline, a mechanism for recording, undoing, and replaying changes to groups of atoms
 * @param options - {@link TimelineOptions}
 * @returns A reference to the timeline created: a {@link TimelineToken}
 */
export function timeline<ManagedAtom extends TimelineManageable>(
	options: TimelineOptions<ManagedAtom>,
): TimelineToken<ManagedAtom> {
	return createTimeline(IMPLICIT.STORE, options)
}
