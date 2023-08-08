import type { ReadonlySelectorFamily, Store } from "atom.io"
import { __INTERNAL__, timeline } from "atom.io"

import { withdraw, type Timeline, Subject } from "../internal"

export const attachTimelineFamily = (
	store: Store = __INTERNAL__.IMPLICIT.STORE,
): ReadonlySelectorFamily<Timeline> => {
	const findTimelineLogState__INTERNAL = __INTERNAL__.atomFamily__INTERNAL<
		Timeline,
		string
	>(
		{
			key: `👁‍🗨 Timeline Update Log (Internal)`,
			default: (key) =>
				store.timelines.get(key) ?? {
					key: ``,
					at: 0,
					timeTraveling: false,
					history: [],
					selectorTime: null,
					transactionKey: null,
					install: () => {},
					subject: new Subject(),
				},
			effects: (key) => [
				({ setSelf }) => {
					const tl = store.timelines.get(key)
					tl?.subject.subscribe((_) => {
						if (store.operation.open === true) {
							const subscription = store.subject.operationStatus.subscribe(
								(operationStatus) => {
									if (operationStatus.open === false) {
										subscription.unsubscribe()
										setSelf({ ...tl })
									}
								},
							)
						} else {
							setSelf({ ...tl })
						}
					})
				},
			],
		},
		store,
	)
	const findTimelineLogState = __INTERNAL__.selectorFamily__INTERNAL<
		Timeline,
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
