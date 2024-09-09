import type { Store } from "atom.io/internal"
import { IMPLICIT } from "atom.io/internal"
import type { JSX } from "solid-js"
import { createContext } from "solid-js"
import h from "solid-js/h"

export const StoreContext = createContext<Store>(IMPLICIT.STORE)

export type StoreProviderProps = {
	children: JSX.Element
	store?: Store
}
export function StoreProvider({
	children,
	store = IMPLICIT.STORE,
}: StoreProviderProps): JSX.Element {
	// @ts-expect-error solid js doesn't make h and JSX.Element compatible
	return h(StoreContext.Provider, { value: store }, children)
}
