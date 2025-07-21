import type {
	RegularAtomFamilyToken,
	RegularAtomToken,
	TransactionToken,
} from "atom.io"
import {
	createAtomFamily,
	createStandaloneAtom,
	createTransaction,
	IMPLICIT,
	type Store,
} from "atom.io/internal"
import type { IntrospectionStates } from "atom.io/introspection"
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
				: [persistSync(window.localStorage, JSON, key.join() + `:view-is-open`)],
	})

	const openCloseAllTX: TransactionToken<
		(path: readonly (number | string)[], current?: boolean) => void
	> = createTransaction<
		(path: readonly (number | string)[], current?: boolean) => void
	>(store, {
		key: `openCloseMultiView`,
		do: ({ get, set }, path, current) => {
			switch (path.length) {
				case 1:
					{
						const currentView = get(devtoolsViewSelectionState)
						switch (currentView) {
							case `atoms`:
								{
									const atomKeys = get(introspectionStates.atomIndex)
									for (const [atomKey] of atomKeys) {
										set(viewIsOpenAtoms, [atomKey], !current)
									}
								}
								break
							case `selectors`:
								{
									const selectorKeys = get(introspectionStates.selectorIndex)
									for (const [selectorKey] of selectorKeys) {
										set(viewIsOpenAtoms, [selectorKey], !current)
									}
								}
								break
							case `timelines`:
								break
							case `transactions`:
								break
						}
					}
					break
				case 2:
					{
						const currentView = get(devtoolsViewSelectionState)
						switch (currentView) {
							case `atoms`:
								{
									const atomKeys = get(introspectionStates.atomIndex)
									const item = atomKeys.get(path[0] as string)
									if (item) {
										if (`familyMembers` in item) {
											for (const [subKey] of item.familyMembers) {
												set(viewIsOpenAtoms, [path[0], subKey], !current)
											}
										} else {
											const value = get(item)
											if (Array.isArray(value)) {
												for (let i = 0; i < value.length; i++) {
													set(viewIsOpenAtoms, [path[0], i], !current)
												}
											} else {
												if (isPlainObject(value)) {
													for (const [key] of Object.keys(value)) {
														set(viewIsOpenAtoms, [path[0], key], !current)
													}
												}
											}
										}
									}
								}
								break
							case `selectors`:
								{
									const selectorKeys = get(introspectionStates.selectorIndex)
									const item = selectorKeys.get(path[0] as string)
									if (item) {
										if (`familyMembers` in item) {
											for (const [subKey] of item.familyMembers) {
												set(viewIsOpenAtoms, [path[0], subKey], !current)
											}
										} else {
											const value = get(item)
											if (Array.isArray(value)) {
												for (let i = 0; i < value.length; i++) {
													set(viewIsOpenAtoms, [path[0], i], !current)
												}
											} else {
												if (isPlainObject(value)) {
													for (const key of Object.keys(value)) {
														set(viewIsOpenAtoms, [path[0], key], !current)
													}
												}
											}
										}
									}
								}
								break
							case `timelines`:
								break
							case `transactions`:
								break
						}
					}
					break
				default: {
					const currentView = get(devtoolsViewSelectionState)
					switch (currentView) {
						case `atoms`:
							{
								const atomKeys = get(introspectionStates.atomIndex)
								const item = atomKeys.get(path[0] as string)
								let value: unknown
								let segments: (number | string)[]
								if (item) {
									if (`familyMembers` in item) {
										const token = item.familyMembers.get(path[1] as string)
										if (!token) {
											throw new Error(`familyMembers missing token`)
										}
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
							break
						case `selectors`:
							{
							}
							break
						case `timelines`:
							break
						case `transactions`:
							break
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
