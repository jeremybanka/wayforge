import type {
	AtomToken,
	RegularAtomFamilyToken,
	RegularAtomToken,
	SelectorToken,
	TransactionToken,
} from "atom.io"
import {
	createAtomFamily,
	createStandaloneAtom,
	createTransaction,
	IMPLICIT,
	type Store,
} from "atom.io/internal"
import type {
	IntrospectionStates,
	WritableTokenIndex,
} from "atom.io/introspection"
import { attachIntrospectionStates, isPlainObject } from "atom.io/introspection"
import { persistSync } from "atom.io/web"
import type { Context } from "react"
import { createContext } from "react"

type DevtoolsView = `atoms` | `selectors` | `timelines` | `transactions`

export type DevtoolsStates = {
	devtoolsAreOpenState: RegularAtomToken<boolean>
	devtoolsViewSelectionState: RegularAtomToken<DevtoolsView>
	devtoolsViewOptionsState: RegularAtomToken<DevtoolsView[]>
	viewIsOpenAtoms: RegularAtomFamilyToken<boolean, readonly (number | string)[]>
	openCloseAllTX: TransactionToken<
		(path: readonly (number | string)[], current?: boolean) => void
	>
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

	const viewIsOpenAtoms = createAtomFamily<
		boolean,
		readonly (number | string)[]
	>(store, {
		key: `🔍 Devtools View Is Open`,
		default: false,
		effects: (key) =>
			typeof window === `undefined`
				? []
				: [persistSync(window.localStorage, JSON, `view-is-open:${key.join()}`)],
	})

	const openCloseAllTX: TransactionToken<
		(path: readonly (number | string)[], current?: boolean) => void
	> = createTransaction<
		(path: readonly (number | string)[], current?: boolean) => void
	>(store, {
		key: `openCloseMultiView`,
		do: ({ get, set }, path, current) => {
			const currentView = get(devtoolsViewSelectionState)
			let states:
				| WritableTokenIndex<AtomToken<unknown>>
				| WritableTokenIndex<SelectorToken<unknown>>
			switch (currentView) {
				case `atoms`:
					states = get(introspectionStates.atomIndex)
					break
				case `selectors`:
					states = get(introspectionStates.selectorIndex)
					break
				case `transactions`:
				case `timelines`:
					return
			}

			switch (path.length) {
				case 1:
					{
						for (const [key] of states) {
							set(viewIsOpenAtoms, [key], !current)
						}
					}
					break
				default: {
					const item = states.get(path[0] as string)
					let value: unknown
					let segments: (number | string)[]
					if (item) {
						if (`familyMembers` in item) {
							if (path.length === 2) {
								for (const [subKey] of item.familyMembers) {
									set(viewIsOpenAtoms, [path[0], subKey], !current)
								}
								return
							}
							// biome-ignore lint/style/noNonNullAssertion: fine here
							const token = item.familyMembers.get(path[1] as string)!
							value = get(token)
							segments = path.slice(2, -1)
						} else {
							value = get(item)
							segments = path.slice(1, -1)
						}
						for (const segment of segments) {
							if (value && typeof value === `object`) {
								value = value[segment as keyof typeof value]
							}
						}
						const head = path.slice(0, -1)
						if (Array.isArray(value)) {
							for (let i = 0; i < value.length; i++) {
								set(viewIsOpenAtoms, [...head, i], !current)
							}
						} else {
							if (isPlainObject(value)) {
								for (const key of Object.keys(value)) {
									set(viewIsOpenAtoms, [...head, key], !current)
								}
							}
						}
					}
				}
			}
		},
	})

	return {
		...introspectionStates,
		devtoolsAreOpenState,
		devtoolsViewSelectionState,
		devtoolsViewOptionsState,
		viewIsOpenAtoms,
		openCloseAllTX,
		store,
	}
}

export const DevtoolsContext: Context<
	DevtoolsStates & IntrospectionStates & { store: Store }
> = createContext(attachDevtoolsStates(IMPLICIT.STORE))
