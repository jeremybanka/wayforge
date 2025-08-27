import type { ReadonlyPureSelectorFamilyToken } from "atom.io"
import type { RootStore, Timeline } from "atom.io/internal"
import {
	createRegularAtomFamily,
	createSelectorFamily,
	Subject,
} from "atom.io/internal"

export const attachTimelineFamily = (
	store: RootStore,
): ReadonlyPureSelectorFamilyToken<Timeline<any>, string> => {
	const findTimelineLogState__INTERNAL = createRegularAtomFamily<
		Timeline<any>,
		string
	>(store, {
		key: `🔍 Timeline Update Log (Internal)`,
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
				subscriptions: new Map(),
			},
		effects: (key) => [
			({ setSelf }) => {
				const tl = store.timelines.get(key)
				tl?.subject.subscribe(`introspection`, (_) => {
					setSelf({ ...tl })
				})
			},
		],
	})
	const findTimelineLogState = createSelectorFamily<Timeline<any>, string>(
		store,
		{
			key: `🔍 Timeline Update Log`,
			get:
				(key) =>
				({ get }) =>
					get(findTimelineLogState__INTERNAL, key),
		},
	)
	return findTimelineLogState
}
