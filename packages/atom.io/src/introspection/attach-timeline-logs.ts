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
					const tl = store.timelines.get(key)
					tl.subject.subscribe(() => {
						if (store.operation.open === true) {
							const subscription = store.subject.operationStatus.subscribe(
								(operationStatus) => {
									if (operationStatus.open === false) {
										subscription.unsubscribe()
										setSelf([...store.timelines.get(key).history])
									}
								},
							)
						} else {
							setSelf([...store.timelines.get(key).history])
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
