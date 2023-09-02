import type { ReadonlySelectorToken, Store, TimelineToken } from "atom.io"
import { __INTERNAL__ } from "atom.io"

export const attachTimelineIndex = (
	store: Store = __INTERNAL__.IMPLICIT.STORE,
): ReadonlySelectorToken<TimelineToken[]> => {
	const timelineTokenIndexState__INTERNAL = __INTERNAL__.createAtom<
		TimelineToken[]
	>(
		{
			key: `👁‍🗨 Timeline Token Index (Internal)`,
			default: () =>
				[...store.timelines].map(([key]) => {
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
	const timelineTokenIndex = __INTERNAL__.createSelector(
		{
			key: `👁‍🗨 Timeline Token Index`,
			get: ({ get }) => get(timelineTokenIndexState__INTERNAL),
		},
		undefined,
		store,
	)
	return timelineTokenIndex
}
