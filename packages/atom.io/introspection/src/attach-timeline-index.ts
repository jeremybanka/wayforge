import type { ReadonlySelectorToken, TimelineToken } from "atom.io"
import type { Store } from "atom.io/internal"
import {
	IMPLICIT,
	createRegularAtom,
	createStandaloneSelector,
} from "atom.io/internal"

export const attachTimelineIndex = (
	store: Store = IMPLICIT.STORE,
): ReadonlySelectorToken<TimelineToken<any>[]> => {
	const timelineTokenIndexState__INTERNAL = createRegularAtom<
		TimelineToken<any>[]
	>(
		{
			key: `👁‍🗨 Timeline Token Index (Internal)`,
			default: () =>
				[...store.timelines].map(([key]): TimelineToken<any> => {
					return { key, type: `timeline` }
				}),
			effects: [
				({ setSelf }) => {
					store.on.timelineCreation.subscribe(
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
	const timelineTokenIndex = createStandaloneSelector(
		{
			key: `👁‍🗨 Timeline Token Index`,
			get: ({ get }) => get(timelineTokenIndexState__INTERNAL),
		},
		store,
	)
	return timelineTokenIndex
}
