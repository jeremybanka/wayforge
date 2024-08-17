import { atom, atomFamily } from "atom.io"
import { attachIntrospectionStates } from "atom.io/introspection"

import { lazyLocalStorageEffect } from "./lazy-local-storage-effect"

export const {
	atomIndex,
	selectorIndex,
	transactionIndex,
	transactionLogSelectors,
	timelineIndex,
	timelineSelectors,
	typeSelectors,
} = attachIntrospectionStates()

export const devtoolsAreOpenState = atom<boolean>({
	key: `👁‍🗨 Devtools Are Open`,
	default: true,
	effects: [lazyLocalStorageEffect(`👁‍🗨 Devtools Are Open`)],
})

type DevtoolsView = `atoms` | `selectors` | `timelines` | `transactions`

export const devtoolsViewSelectionState = atom<DevtoolsView>({
	key: `👁‍🗨 Devtools View Selection`,
	default: `atoms`,
	effects: [lazyLocalStorageEffect(`👁‍🗨 Devtools View`)],
})

export const devtoolsViewOptionsState = atom<DevtoolsView[]>({
	key: `👁‍🗨 Devtools View Options`,
	default: [`atoms`, `selectors`, `transactions`, `timelines`],
	effects: [lazyLocalStorageEffect(`👁‍🗨 Devtools View Options`)],
})

export const viewIsOpenAtoms = atomFamily<boolean, string>({
	key: `👁‍🗨 Devtools View Is Open`,
	default: false,
	effects: (key) => [lazyLocalStorageEffect(key + `:view-is-open`)],
})
