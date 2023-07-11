import * as React from "react"

import * as AtomIO from "atom.io"

export const StoreContext = React.createContext<AtomIO.Store>(
  AtomIO.__INTERNAL__.IMPLICIT.STORE
)

export const StoreProvider: React.FC<{
  children: React.ReactNode
  store?: AtomIO.Store
}> = ({ children, store = AtomIO.__INTERNAL__.IMPLICIT.STORE }) => (
  <StoreContext.Provider value={store}>{children}</StoreContext.Provider>
)
