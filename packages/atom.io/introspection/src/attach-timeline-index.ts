import type { ReadonlySelectorToken, TimelineToken } from "atom.io"
import type { Store } from "atom.io/internal"
import { IMPLICIT, createAtom, createSelector } from "atom.io/internal"

export const attachTimelineIndex = (
	store: Store = IMPLICIT.STORE,
): ReadonlySelectorToken<TimelineToken[]> => {
	const timelineTokenIndexState__INTERNAL = createAtom<TimelineToken[]>(
		{
			key: `👁‍🗨 Timeline Token Index (Internal)`,
			default: () =>
				[...store.timelines].map(([key]): TimelineToken => {
					return { key, type: `timeline` }
				}),
			effects: [
				({ setSelf }) => {
					store.subject.timelineCreation.subscribe(
						`introspection`,
						(timelineToken) => {
							setSelf((state) => [...state, timelineToken])
						},
					)
				},
			],
		},
		undefined,
		store,
	)
	const timelineTokenIndex = createSelector(
		{
			key: `👁‍🗨 Timeline Token Index`,
			get: ({ get }) => get(timelineTokenIndexState__INTERNAL),
		},
		undefined,
		store,
	)
	return timelineTokenIndex
}
