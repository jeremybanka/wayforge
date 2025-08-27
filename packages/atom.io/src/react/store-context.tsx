import type { RootStore } from "atom.io/internal"
import { IMPLICIT } from "atom.io/internal"
import * as React from "react"

export const StoreContext: React.Context<RootStore> = React.createContext(
	IMPLICIT.STORE,
)

export const StoreProvider: React.FC<{
	children: React.ReactNode
	store?: RootStore
}> = ({ children, store = IMPLICIT.STORE }) => (
	<StoreContext.Provider value={store}>{children}</StoreContext.Provider>
)
