import HAMT from "hamt_plus"

import type { Store, StoreCore } from "./store"
import { IMPLICIT } from "./store"
import { getState, setState } from ".."
import type { TransactionOptions, ƒn } from "../transaction"

export type TransactionStore =
  | {
      open: false
    }
  | {
      open: true
      closing: boolean
      next: StoreCore
      atomsUpdated: Set<string>
      params: unknown[]
      output: unknown
      update: [string, { newValue: unknown; oldValue?: unknown }][]
    }

export const finishTransaction = (output: unknown, store: Store): void => {
  if (!store.transaction.open) {
    store.config.logger?.warn(
      `abortTransaction called outside of a transaction. This is probably a bug.`
    )
    return
  }
  store.transaction.closing = true
  store.transaction.output = output
  store.atoms = store.transaction.next.atoms
  store.readonlySelectors = store.transaction.next.readonlySelectors
  store.selectorGraph = store.transaction.next.selectorGraph
  store.selectorAtoms = store.transaction.next.selectorAtoms
  store.selectors = store.transaction.next.selectors
  store.valueMap = store.transaction.next.valueMap
  for (const key of store.transaction.atomsUpdated) {
    setState(
      { key, type: `atom` },
      HAMT.get(key, store.transaction.next.valueMap),
      store
    )
  }
  store.transaction = { open: false }
  store.config.logger?.info(`🛬`, `transaction done`)
}
export const startTransaction = (params: unknown[], store: Store): void => {
  store.transaction = {
    open: true,
    closing: false,
    next: {
      atoms: store.atoms,
      atomsThatAreDefault: store.atomsThatAreDefault,
      operation: { open: false },
      readonlySelectors: store.readonlySelectors,
      selectorAtoms: store.selectorAtoms,
      selectorGraph: store.selectorGraph,
      selectors: store.selectors,
      valueMap: store.valueMap,
    },
    atomsUpdated: new Set(),
    params,
    output: undefined,
    update: [],
  }
  store.config.logger?.info(`🛫`, `transaction start`)
}
export const abortTransaction = (store: Store): void => {
  if (!store.transaction.open) {
    store.config.logger?.warn(
      `abortTransaction called outside of a transaction. This is probably a bug.`
    )
    return
  }
  store.transaction = { open: false }
  store.config.logger?.info(`🪂`, `transaction fail`)
}

export function transaction__INTERNAL<ƒ extends ƒn>(
  options: TransactionOptions<ƒ>,
  store: Store = IMPLICIT.STORE
): ((...params: Parameters<ƒ>) => ReturnType<ƒ>) & { key: string } {
  return Object.assign(
    (...params: Parameters<ƒ>) => {
      startTransaction(params, store)
      try {
        const result = options.do(
          {
            get: (token) => getState(token, store),
            set: (token, value) => setState(token, value, store),
          },
          ...params
        )
        finishTransaction(result, store)
        return result
      } catch (thrown) {
        abortTransaction(store)
        store.config.logger?.error(`Transaction ${options.key} failed`, thrown)
        throw thrown
      }
    },
    { key: options.key }
  )
}

export const target = (store: Store = IMPLICIT.STORE): StoreCore =>
  store.transaction.open ? store.transaction.next : store
