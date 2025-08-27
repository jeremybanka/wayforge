import type { Loadable, ReadonlyPureSelectorFamilyToken } from "atom.io"
import type { RootStore } from "atom.io/internal"
import { createReadonlyPureSelectorFamily } from "atom.io/internal"

import { discoverType } from "./refinery"

export const attachTypeSelectors = (
	store: RootStore,
): ReadonlyPureSelectorFamilyToken<Loadable<string>, string> => {
	const typeSelectors = createReadonlyPureSelectorFamily<
		Loadable<string>,
		string
	>(store, {
		key: `🔍 State Type`,
		get:
			(key) =>
			async ({ get }) => {
				let state: unknown
				try {
					const token =
						store.atoms.get(key) ??
						store.writableSelectors.get(key) ??
						store.readonlySelectors.get(key)
					if (token === undefined) {
						throw new Error(`Could not find state with key "${key}"`)
					}
					state = get(token)
				} catch (_) {
					return `error`
				}
				if (state instanceof Promise) {
					state = await state
				}
				const typeOfState = discoverType(state)
				return typeOfState
			},
	})
	return typeSelectors
}
