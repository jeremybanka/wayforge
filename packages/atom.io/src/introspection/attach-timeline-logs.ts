import type { ReadonlySelectorFamily, Store, TimelineUpdate } from "atom.io"
import { __INTERNAL__ } from "atom.io"

export const attachTimelineLogs = (
	store: Store = __INTERNAL__.IMPLICIT.STORE,
): ReadonlySelectorFamily<TimelineUpdate[]> => {
	const findTimelineLogState__INTERNAL = __INTERNAL__.atomFamily__INTERNAL<
		TimelineUpdate[],
		string
	>(
		{
			key: `👁‍🗨 Timeline Update Log (Internal)`,
			default: (key) => store.timelines.get(key).history,
			effects: (key) => [
				({ setSelf }) => {
					const tx = store.timelines.get(key)
					tx.subject.subscribe((timelineUpdate) => {
						if (timelineUpdate.key === key) {
							setSelf((state) => [...state, timelineUpdate])
						}
					})
				},
			],
		},
		store,
	)
	const findTimelineLogState = __INTERNAL__.selectorFamily__INTERNAL<
		TimelineUpdate[],
		string
	>(
		{
			key: `👁‍🗨 Timeline Update Log`,
			get: (key) => ({ get }) => get(findTimelineLogState__INTERNAL(key)),
		},
		store,
	)
	return findTimelineLogState
}
