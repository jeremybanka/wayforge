import HAMT from "hamt_plus"
import * as Rx from "rxjs"

import { deposit, withdraw } from "./get"
import type { Store, StoreCore } from "./store"
import { IMPLICIT } from "./store"
import type { AtomToken, TransactionToken } from ".."
import { getState, setState } from ".."
import type { Transaction, TransactionOptions, ƒn } from "../transaction"

export const TRANSACTION_PHASES = [`idle`, `building`, `applying`] as const
export type TransactionPhase = (typeof TRANSACTION_PHASES)[number]

export type TransactionAtomUpdate = [
  string,
  { newValue: unknown; oldValue?: unknown }
]

export type TransactionInProgress<ƒ extends ƒn> = {
  key: string
  phase: `applying` | `building`
  core: StoreCore
  atomUpdates: TransactionAtomUpdate[]
  params: Parameters<ƒ>[]
  output: ReturnType<ƒ>
}
type TransactionIdle = {
  phase: `idle`
}

export type TransactionStatus<ƒ extends ƒn> =
  | TransactionIdle
  | TransactionInProgress<ƒ>

export type TransactionUpdate<ƒ extends ƒn> = Pick<
  TransactionInProgress<ƒ>,
  `atomUpdates` | `key` | `output` | `params`
>

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
      actions: store.actions,
      selectorAtoms: store.selectorAtoms,
      selectorGraph: store.selectorGraph,
      selectors: store.selectors,
      valueMap: store.valueMap,
    },
    atomUpdates: [],
    params,
    output: undefined,
  }
  store.config.logger?.info(`🛫`, `transaction start`)
}
export const applyTransaction = <ƒ extends ƒn>(
  output: ReturnType<ƒ>,
  store: Store
): void => {
  if (store.transaction.phase !== `building`) {
    store.config.logger?.warn(
      `abortTransaction called outside of a transaction. This is probably a bug.`
    )
    return
  }
  store.transaction.phase = `applying`
  store.transaction.output = output
  const { atomUpdates } = store.transaction
  for (const [key, update] of atomUpdates) {
    const token: AtomToken<unknown> = { key, type: `atom` }
    const state = withdraw(token, store)
    setState(state, update.newValue, store)
  }
  const tx = withdraw<ƒ>(
    { key: store.transaction.key, type: `transaction` },
    store
  )
  tx.subject.next({
    key: store.transaction.key,
    atomUpdates,
    output,
    params: store.transaction.params,
  })
  store.transaction = { phase: `idle` }
  store.config.logger?.info(`🛬`, `transaction done`)
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
): TransactionToken<ƒ> {
  const newTransaction: Transaction<ƒ> = {
    key: options.key,
    type: `transaction`,
    run: (...params: Parameters<ƒ>) => {
      buildTransaction(options.key, params, store)
      try {
        const output = options.do(
          {
            get: (token) => getState(token, store),
            set: (token, value) => setState(token, value, store),
          },
          ...params
        )
        applyTransaction(output, store)
        return output
      } catch (thrown) {
        abortTransaction(store)
        store.config.logger?.error(`Transaction ${options.key} failed`, thrown)
        throw thrown
      }
    },
    subject: new Rx.Subject(),
  }
  const core = target(store)
  core.actions = HAMT.set(newTransaction.key, newTransaction, core.actions)
  const token = deposit(newTransaction)
  return token
}

export const target = (store: Store = IMPLICIT.STORE): StoreCore =>
  store.transaction.phase === `building` ? store.transaction.core : store
