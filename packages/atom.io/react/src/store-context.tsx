import type { Store } from "atom.io/internal"
import { IMPLICIT } from "atom.io/internal"
import * as React from "react"

export const StoreContext = React.createContext<Store>(IMPLICIT.STORE)

export const StoreProvider: React.FC<{
	children: React.ReactNode
	store?: Store
}> = ({ children, store = IMPLICIT.STORE }) => (
	<StoreContext.Provider value={store}>{children}</StoreContext.Provider>
)
