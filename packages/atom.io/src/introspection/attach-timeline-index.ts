import type { AtomToken, TimelineToken } from "atom.io"
import type { Store } from "atom.io/internal"
import { createRegularAtom } from "atom.io/internal"

export const attachTimelineIndex = (
	store: Store,
): AtomToken<TimelineToken<any>[]> => {
	return createRegularAtom<TimelineToken<any>[]>(
		store,
		{
			key: `🔍 Timeline Token Index`,
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
	)
}
