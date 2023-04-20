import HAMT from "hamt_plus"

import type { Store, StoreCore } from "./store"
import { IMPLICIT } from "./store"
import { getState, setState } from ".."
import type { TransactionOptions, ƒn } from "../transaction"

export const TRANSACTION_PHASES = [`idle`, `building`, `applying`] as const
export type TransactionPhase = (typeof TRANSACTION_PHASES)[number]

export type TransactionAtomUpdate = [
  string,
  { newValue: unknown; oldValue?: unknown }
]

export type TransactionProgress =
  | {
      key: string
      phase: `applying` | `building`
      core: StoreCore
      atomsUpdated: Set<string>
      atomUpdates: TransactionAtomUpdate[]
      params: unknown[]
      output: unknown
    }
  | {
      phase: `idle`
    }

export const applyTransaction = (output: unknown, store: Store): void => {
  if (store.transaction.phase !== `building`) {
    store.config.logger?.warn(
      `abortTransaction called outside of a transaction. This is probably a bug.`
    )
    return
  }
  const { core } = store.transaction
  const { atomsUpdated } = store.transaction
  store.transaction.output = output
  store.transaction.phase = `applying`
  store = {
    ...store,
    ...core,
  }
  for (const key of atomsUpdated) {
    setState({ key, type: `atom` }, HAMT.get(key, core.valueMap), store)
  }
  store.transaction = { phase: `idle` }
  store.config.logger?.info(`🛬`, `transaction done`)
}
export const buildTransaction = (
  key: string,
  params: unknown[],
  store: Store
): void => {
  store.transaction = {
    key,
    phase: `building`,
    core: {
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
    atomUpdates: [],
    params,
    output: undefined,
  }
  store.config.logger?.info(`🛫`, `transaction start`)
}
export const abortTransaction = (store: Store): void => {
  if (store.transaction.phase === `idle`) {
    store.config.logger?.warn(
      `abortTransaction called outside of a transaction. This is probably a bug.`
    )
    return
  }
  store.transaction = { phase: `idle` }
  store.config.logger?.info(`🪂`, `transaction fail`)
}

export function transaction__INTERNAL<ƒ extends ƒn>(
  options: TransactionOptions<ƒ>,
  store: Store = IMPLICIT.STORE
): ((...params: Parameters<ƒ>) => ReturnType<ƒ>) & { key: string } {
  return Object.assign(
    (...params: Parameters<ƒ>) => {
      buildTransaction(options.key, params, store)
      try {
        const result = options.do(
          {
            get: (token) => getState(token, store),
            set: (token, value) => setState(token, value, store),
          },
          ...params
        )
        applyTransaction(result, store)
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
  store.transaction.phase === `idle` ? store : store.transaction.core
