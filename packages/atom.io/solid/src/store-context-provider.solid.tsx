/** @jsxImportSource solid-js */
/** @jsx preserve */

import type { Store } from "atom.io/internal"
import { IMPLICIT } from "atom.io/internal"
import type { JSX } from "solid-js"
import { createContext } from "solid-js"

export const StoreContext = createContext<Store>(IMPLICIT.STORE)

export type StoreProviderProps = {
	children: JSX.Element
	store?: Store
}
export function StoreProvider({
	children,
	store = IMPLICIT.STORE,
}: StoreProviderProps): JSX.Element {
	return <StoreContext.Provider value={store}>{children}</StoreContext.Provider>
}
