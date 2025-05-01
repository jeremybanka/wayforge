import type { RegularAtomFamilyToken, RegularAtomToken } from "atom.io"
import {
	createAtomFamily,
	createStandaloneAtom,
	IMPLICIT,
	type Store,
} from "atom.io/internal"
import type { IntrospectionStates } from "atom.io/introspection"
import { attachIntrospectionStates } from "atom.io/introspection"
import { persistSync } from "atom.io/web"
import { createContext } from "react"

type DevtoolsView = `atoms` | `selectors` | `timelines` | `transactions`

export type DevtoolsStates = {
	devtoolsAreOpenState: RegularAtomToken<boolean>
	devtoolsViewSelectionState: RegularAtomToken<DevtoolsView>
	devtoolsViewOptionsState: RegularAtomToken<DevtoolsView[]>
	viewIsOpenAtoms: RegularAtomFamilyToken<boolean, string>
}

export function attachDevtoolsStates(
	store: Store,
): DevtoolsStates & IntrospectionStates & { store: Store } {
	const introspectionStates = attachIntrospectionStates(store)

	const devtoolsAreOpenState = createStandaloneAtom<boolean>(store, {
		key: `🔍 Devtools Are Open`,
		default: true,
		effects:
			typeof window === `undefined`
				? []
				: [persistSync(window.localStorage, JSON, `🔍 Devtools Are Open`)],
	})

	const devtoolsViewSelectionState = createStandaloneAtom<DevtoolsView>(store, {
		key: `🔍 Devtools View Selection`,
		default: `atoms`,
		effects:
			typeof window === `undefined`
				? []
				: [persistSync(window.localStorage, JSON, `🔍 Devtools View`)],
	})

	const devtoolsViewOptionsState = createStandaloneAtom<DevtoolsView[]>(store, {
		key: `🔍 Devtools View Options`,
		default: [`atoms`, `selectors`, `transactions`, `timelines`],
		effects:
			typeof window === `undefined`
				? []
				: [persistSync(window.localStorage, JSON, `🔍 Devtools View Options`)],
	})

	const viewIsOpenAtoms = createAtomFamily<boolean, string>(store, {
		key: `🔍 Devtools View Is Open`,
		default: false,
		effects: (key) =>
			typeof window === `undefined`
				? []
				: [persistSync(window.localStorage, JSON, key + `:view-is-open`)],
	})

	return {
		...introspectionStates,
		devtoolsAreOpenState,
		devtoolsViewSelectionState,
		devtoolsViewOptionsState,
		viewIsOpenAtoms,
		store,
	}
}

export const DevtoolsContext = createContext<
	DevtoolsStates & IntrospectionStates & { store: Store }
>(attachDevtoolsStates(IMPLICIT.STORE))
