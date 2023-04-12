import type { Store } from "./store"

export const finishTransaction = (store: Store): void => {
  store.transaction = { open: false }
  store.config.logger?.info(`💸`, `transaction done`)
}
export const startTransaction = (store: Store): void => {
  store.transaction = {
    open: true,
    prev: {
      atoms: store.atoms,
      readonlySelectors: store.readonlySelectors,
      selectorGraph: store.selectorGraph,
      selectors: store.selectors,
      valueMap: store.valueMap,
    },
  }
  store.config.logger?.info(`🏦`, `transaction start`)
}
export const abortTransaction = (store: Store): void => {
  if (!store.transaction.open) {
    store.config.logger?.warn(
      `abortTransaction called outside of a transaction. This is probably a bug.`
    )
    return
  }
  store.atoms = store.transaction.prev.atoms
  store.readonlySelectors = store.transaction.prev.readonlySelectors
  store.selectorGraph = store.transaction.prev.selectorGraph
  store.selectors = store.transaction.prev.selectors
  store.valueMap = store.transaction.prev.valueMap
  store.transaction = { open: false }
  store.config.logger?.info(`🪂`, `transaction fail`)
}
