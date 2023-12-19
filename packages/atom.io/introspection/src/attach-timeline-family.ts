import type { ReadonlySelectorFamily } from "atom.io"
import type { Store, Timeline } from "atom.io/internal"
import {
	IMPLICIT,
	Subject,
	createRegularAtomFamily,
	createSelectorFamily,
} from "atom.io/internal"

export const attachTimelineFamily = (
	store: Store = IMPLICIT.STORE,
): ReadonlySelectorFamily<Timeline> => {
	const findTimelineLogState__INTERNAL = createRegularAtomFamily<
		Timeline,
		string
	>(
		{
			key: `👁‍🗨 Timeline Update Log (Internal)`,
			default: (key) =>
				store.timelines.get(key) ?? {
					type: `timeline`,
					key: ``,
					at: 0,
					timeTraveling: null,
					history: [],
					selectorTime: null,
					transactionKey: null,
					install: () => {},
					subject: new Subject(),
				},
			effects: (key) => [
				({ setSelf }) => {
					const tl = store.timelines.get(key)
					tl?.subject.subscribe(`introspection`, (_) => {
						if (store.operation.open === true) {
							const unsubscribe = store.subject.operationStatus.subscribe(
								`introspection`,
								(operationStatus) => {
									if (operationStatus.open === false) {
										unsubscribe()
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
	const findTimelineLogState = createSelectorFamily<Timeline, string>(
		{
			key: `👁‍🗨 Timeline Update Log`,
			get:
				(key) =>
				({ get }) =>
					get(findTimelineLogState__INTERNAL(key)),
		},
		store,
	)
	return findTimelineLogState
}
