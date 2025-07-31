import type {
	Timeline,
	TimelineAtomUpdate,
	TimelineMoleculeCreation,
	TimelineMoleculeDisposal,
	TimelineSelectorUpdate,
	TimelineStateCreation,
	TimelineStateDisposal,
	TimelineTransactionUpdate,
} from "atom.io/internal"
import { createTimeline, IMPLICIT, timeTravel } from "atom.io/internal"

import type { AtomFamilyToken, AtomToken } from "."

/** @public */
export type TimelineManageable = AtomFamilyToken<any, any> | AtomToken<any>
/** @public */
export type AtomOnly<M extends TimelineManageable> = M extends AtomFamilyToken<
	any,
	any
>
	? AtomToken<any>
	: M extends AtomToken<any>
		? M
		: never

/** @public */
export type TimelineToken<M> = {
	/** The unique identifier of the timeline */
	key: string
	/** Discriminator */
	type: `timeline`
	/** Never present. This is a marker that preserves the type of the managed atoms */
	__M?: M
}

/** @public */
export type TimelineOptions<ManagedAtom extends TimelineManageable> = {
	/** The unique identifier of the timeline */
	key: string
	/** The managed atoms (and families of atoms) to record */
	scope: ManagedAtom[]
	/** A function that determines whether a given update should be recorded */
	shouldCapture?: (
		update: TimelineUpdate<ManagedAtom>,
		timeline: Timeline<TimelineManageable>,
	) => boolean
}

/** @public */
export type TimelineUpdate<ManagedAtom extends TimelineManageable> =
	| TimelineAtomUpdate<ManagedAtom>
	| TimelineMoleculeCreation
	| TimelineMoleculeDisposal
	| TimelineSelectorUpdate<ManagedAtom>
	| TimelineStateCreation<AtomOnly<ManagedAtom>>
	| TimelineStateDisposal<AtomOnly<ManagedAtom>>
	| TimelineTransactionUpdate

/**
 * @public
 * Create a timeline, a mechanism for recording, undoing, and replaying changes to groups of atoms.
 * @param options - {@link TimelineOptions}
 * @returns A reference to the timeline created: a {@link TimelineToken}
 */
export const timeline = <ManagedAtom extends TimelineManageable>(
	options: TimelineOptions<ManagedAtom>,
): TimelineToken<ManagedAtom> => {
	return createTimeline(IMPLICIT.STORE, options)
}

export const redo = (tl: TimelineToken<any>): void => {
	timeTravel(IMPLICIT.STORE, `redo`, tl)
}

export const undo = (tl: TimelineToken<any>): void => {
	timeTravel(IMPLICIT.STORE, `undo`, tl)
}
