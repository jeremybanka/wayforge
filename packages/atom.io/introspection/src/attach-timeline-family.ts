import type { ReadonlySelectorFamilyToken } from "atom.io"
import type { Store, Timeline } from "atom.io/internal"
import {
	createRegularAtomFamily,
	createSelectorFamily,
	IMPLICIT,
	Subject,
} from "atom.io/internal"

export const attachTimelineFamily = (
	store: Store = IMPLICIT.STORE,
): ReadonlySelectorFamilyToken<Timeline<any>, string> => {
	const findTimelineLogState__INTERNAL = createRegularAtomFamily<
		Timeline<any>,
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
						setSelf({ ...tl })
					})
				},
			],
		},
		store,
	)
	const findTimelineLogState = createSelectorFamily<Timeline<any>, string>(
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
