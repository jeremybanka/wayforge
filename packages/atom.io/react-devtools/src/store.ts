import { atom, atomFamily } from "atom.io"
import { attachIntrospectionStates } from "atom.io/introspection"
import { persistSync } from "atom.io/web"

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
	effects:
		typeof window === `undefined`
			? []
			: [persistSync(window.localStorage)(JSON)(`👁‍🗨 Devtools Are Open`)],
})

type DevtoolsView = `atoms` | `selectors` | `timelines` | `transactions`

export const devtoolsViewSelectionState = atom<DevtoolsView>({
	key: `👁‍🗨 Devtools View Selection`,
	default: `atoms`,
	effects:
		typeof window === `undefined`
			? []
			: [persistSync(window.localStorage)(JSON)(`👁‍🗨 Devtools View`)],
})

export const devtoolsViewOptionsState = atom<DevtoolsView[]>({
	key: `👁‍🗨 Devtools View Options`,
	default: [`atoms`, `selectors`, `transactions`, `timelines`],
	effects:
		typeof window === `undefined`
			? []
			: [persistSync(window.localStorage)(JSON)(`👁‍🗨 Devtools View Options`)],
})

export const viewIsOpenAtoms = atomFamily<boolean, string>({
	key: `👁‍🗨 Devtools View Is Open`,
	default: false,
	effects: (key) =>
		typeof window === `undefined`
			? []
			: [persistSync(window.localStorage)(JSON)(key + `:view-is-open`)],
})
