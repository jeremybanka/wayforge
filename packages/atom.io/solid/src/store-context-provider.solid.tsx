import type { Store } from "atom.io/internal"
import { IMPLICIT } from "atom.io/internal"
import type { JSX } from "solid-js"
import { createContext } from "solid-js"
import h from "solid-js/h"
import type { HyperScript } from "solid-js/h/types/hyperscript.js"

export const StoreContext = createContext<Store>(IMPLICIT.STORE)

export type StoreProviderProps = {
	children: JSX.Element
	store?: Store
}
export function StoreProvider({
	children,
	store = IMPLICIT.STORE,
}: StoreProviderProps): ReturnType<HyperScript> {
	return h(StoreContext.Provider, { value: store }, children)
}
