import * as React from "react"

import * as AtomIO from "atom.io"

export const storeContext = React.createContext<AtomIO.Store>(
  AtomIO.__INTERNAL__.IMPLICIT.STORE
)

export const StoreProvider: React.FC<{
  children: React.ReactNode
  store?: AtomIO.Store
}> = ({ children, store = AtomIO.__INTERNAL__.IMPLICIT.STORE }) => (
  <storeContext.Provider value={store}>{children}</storeContext.Provider>
)
