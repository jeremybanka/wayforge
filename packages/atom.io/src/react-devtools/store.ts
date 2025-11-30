import type {
	AtomToken,
	RegularAtomFamilyToken,
	RegularAtomToken,
	SelectorToken,
	TransactionToken,
} from "atom.io"
import type { RootStore, Store } from "atom.io/internal"
import {
	createRegularAtom,
	createRegularAtomFamily,
	createTransaction,
} from "atom.io/internal"
import type {
	IntrospectionStates,
	ReadonlyTokenIndex,
} from "atom.io/introspection"
import { attachIntrospectionStates, isPlainObject } from "atom.io/introspection"
import { storageSync } from "atom.io/web"
import type { Context } from "react"
import { createContext } from "react"

type DevtoolsView = `atoms` | `selectors` | `timelines` | `transactions`

export type DevtoolsStates = {
	devtoolsAreHiddenAtom: RegularAtomToken<boolean>
	devtoolsAreOpenAtom: RegularAtomToken<boolean>
	devtoolsViewSelectionAtom: RegularAtomToken<DevtoolsView>
	devtoolsViewOptionsAtom: RegularAtomToken<DevtoolsView[]>
	viewIsOpenAtoms: RegularAtomFamilyToken<boolean, readonly (number | string)[]>
	openCloseAllTX: TransactionToken<
		(path: readonly (number | string)[], current?: boolean) => void
	>
}

export function attachDevtoolsStates(
	store: RootStore,
	hideByDefault = false,
): DevtoolsStates & IntrospectionStates & { store: Store } {
	const introspectionStates = attachIntrospectionStates(store)

	const devtoolsAreHiddenAtom = createRegularAtom<boolean, never, never>(
		store,
		{
			key: `🔍 Devtools Are Hidden`,
			default: hideByDefault,
			effects:
				typeof window === `undefined`
					? []
					: [
							storageSync(window.localStorage, JSON, `🔍 Devtools Are Hidden`),
							({ setSelf }) => {
								window.addEventListener(`keydown`, (e) => {
									if (e.ctrlKey && e.shiftKey && e.key.toLowerCase() === `a`) {
										e.preventDefault()
										setSelf((state) => !state)
									}
								})
							},
						],
		},
		undefined,
	)

	const devtoolsAreOpenAtom = createRegularAtom<boolean, never, never>(
		store,
		{
			key: `🔍 Devtools Are Open`,
			default: true,
			effects:
				typeof window === `undefined`
					? []
					: [storageSync(window.localStorage, JSON, `🔍 Devtools Are Open`)],
		},
		undefined,
	)

	const devtoolsViewSelectionAtom = createRegularAtom<
		DevtoolsView,
		never,
		never
	>(
		store,
		{
			key: `🔍 Devtools View Selection`,
			default: `atoms`,
			effects:
				typeof window === `undefined`
					? []
					: [storageSync(window.localStorage, JSON, `🔍 Devtools View`)],
		},
		undefined,
	)

	const devtoolsViewOptionsAtom = createRegularAtom<
		DevtoolsView[],
		never,
		never
	>(
		store,
		{
			key: `🔍 Devtools View Options`,
			default: [`atoms`, `selectors`, `transactions`, `timelines`],
			effects:
				typeof window === `undefined`
					? []
					: [storageSync(window.localStorage, JSON, `🔍 Devtools View Options`)],
		},
		undefined,
	)

	const viewIsOpenAtoms = createRegularAtomFamily<
		boolean,
		readonly (number | string)[],
		never
	>(store, {
		key: `🔍 Devtools View Is Open`,
		default: false,
		effects: (key) =>
			typeof window === `undefined`
				? []
				: [storageSync(window.localStorage, JSON, `view-is-open:${key.join()}`)],
	})

	const openCloseAllTX: TransactionToken<
		(path: readonly (number | string)[], current?: boolean) => void
	> = createTransaction<
		(path: readonly (number | string)[], current?: boolean) => void
	>(store, {
		key: `🔍 Open Close All`,
		do: ({ get, set }, path, current) => {
			const currentView = get(devtoolsViewSelectionAtom)
			let states:
				| ReadonlyTokenIndex<AtomToken<unknown, any, any>>
				| ReadonlyTokenIndex<SelectorToken<unknown, any, any>>
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
		devtoolsAreHiddenAtom,
		devtoolsAreOpenAtom,
		devtoolsViewSelectionAtom,
		devtoolsViewOptionsAtom,
		viewIsOpenAtoms,
		openCloseAllTX,
		store,
	}
}

export const DevtoolsContext: Context<
	DevtoolsStates & IntrospectionStates & { store: Store }
> = createContext({})
