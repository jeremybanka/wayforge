import type { Store } from "atom.io/internal"
import { IMPLICIT } from "atom.io/internal"
import type { ReactNode } from "react"
import { createContext } from "react"

export const StoreContext = createContext<Store>(IMPLICIT.STORE)
export type StoreProviderProps = { children: ReactNode; store?: Store }
export function StoreProvider({
	children,
	store = IMPLICIT.STORE,
}: StoreProviderProps): ReactNode {
	return <StoreContext.Provider value={store}>{children}</StoreContext.Provider>
}
