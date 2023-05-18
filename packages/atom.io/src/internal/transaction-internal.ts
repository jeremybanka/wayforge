import HAMT from "hamt_plus"
import * as Rx from "rxjs"

import type { Store, StoreCore } from "."
import { cacheValue, deposit, withdraw, IMPLICIT } from "."
import { getState, setState } from ".."
import type {
  AtomToken,
  StateUpdate,
  Transaction,
  TransactionOptions,
  TransactionToken,
  ƒn,
} from ".."

export const TRANSACTION_PHASES = [`idle`, `building`, `applying`] as const
export type TransactionPhase = (typeof TRANSACTION_PHASES)[number]

export type KeyedStateUpdate<T> = StateUpdate<T> & {
  key: string
}
export type TransactionUpdate<ƒ extends ƒn> = {
  key: string
  atomUpdates: KeyedStateUpdate<unknown>[]
  params: Parameters<ƒ>
  output: ReturnType<ƒ>
}

export type TransactionUpdateInProgress<ƒ extends ƒn> = TransactionUpdate<ƒ> & {
  phase: `applying` | `building`
  core: StoreCore
}
export type TransactionIdle = {
  phase: `idle`
}
export type TransactionStatus<ƒ extends ƒn> =
  | TransactionIdle
  | TransactionUpdateInProgress<ƒ>

export const buildTransaction = (
  key: string,
  params: any[],
  store: Store
): void => {
  store.transactionStatus = {
    key,
    phase: `building`,
    core: {
      atoms: store.atoms,
      atomsThatAreDefault: store.atomsThatAreDefault,
      operation: { open: false },
      readonlySelectors: store.readonlySelectors,
      timelines: store.timelines,
      timelineAtoms: store.timelineAtoms,
      transactions: store.transactions,
      selectorAtoms: store.selectorAtoms,
      selectorGraph: store.selectorGraph,
      selectors: store.selectors,
      valueMap: store.valueMap,
    },
    atomUpdates: [],
    params,
    output: undefined,
  }
  store.config.logger?.info(`🛫`, `transaction "${key}" started`)
}
export const applyTransaction = <ƒ extends ƒn>(
  output: ReturnType<ƒ>,
  store: Store
): void => {
  if (store.transactionStatus.phase !== `building`) {
    store.config.logger?.warn(
      `abortTransaction called outside of a transaction. This is probably a bug.`
    )
    return
  }
  store.config.logger?.info(
    `🛃 apply transaction "${store.transactionStatus.key}"`
  )
  store.transactionStatus.phase = `applying`
  store.transactionStatus.output = output
  const { atomUpdates } = store.transactionStatus

  for (const { key, newValue } of atomUpdates) {
    const token: AtomToken<unknown> = { key, type: `atom` }
    if (!HAMT.has(token.key, store.valueMap)) {
      const atom = HAMT.get(token.key, store.transactionStatus.core.atoms)
      store.atoms = HAMT.set(atom.key, atom, store.atoms)
      store.valueMap = HAMT.set(atom.key, atom.default, store.valueMap)
      store.config.logger?.info(`🔧`, `add atom "${atom.key}"`)
    }
    const state = withdraw(token, store)

    setState(state, newValue, store)
  }
  const myTransaction = withdraw<ƒ>(
    { key: store.transactionStatus.key, type: `transaction` },
    store
  )
  myTransaction.subject.next({
    key: store.transactionStatus.key,
    atomUpdates,
    output,
    params: store.transactionStatus.params as Parameters<ƒ>,
  })
  store.transactionStatus = { phase: `idle` }
  store.config.logger?.info(`🛬`, `transaction done`)
}
export const undoTransactionUpdate = <ƒ extends ƒn>(
  update: TransactionUpdate<ƒ>,
  store: Store
): void => {
  store.config.logger?.info(` ⏮ undo transaction "${update.key}" (undo)`)
  for (const { key, oldValue } of update.atomUpdates) {
    const token: AtomToken<unknown> = { key, type: `atom` }
    const state = withdraw(token, store)
    setState(state, oldValue, store)
  }
}
export const redoTransactionUpdate = <ƒ extends ƒn>(
  update: TransactionUpdate<ƒ>,
  store: Store
): void => {
  store.config.logger?.info(` ⏭ redo transaction "${update.key}" (redo)`)
  for (const { key, newValue } of update.atomUpdates) {
    const token: AtomToken<unknown> = { key, type: `atom` }
    const state = withdraw(token, store)
    setState(state, newValue, store)
  }
}

export const abortTransaction = (store: Store): void => {
  if (store.transactionStatus.phase === `idle`) {
    store.config.logger?.warn(
      `abortTransaction called outside of a transaction. This is probably a bug.`
    )
    return
  }
  store.transactionStatus = { phase: `idle` }
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
  core.transactions = HAMT.set(
    newTransaction.key,
    newTransaction,
    core.transactions
  )
  const token = deposit(newTransaction)
  store.subject.transactionCreation.next(token)
  return token
}

export const target = (store: Store = IMPLICIT.STORE): StoreCore =>
  store.transactionStatus.phase === `building`
    ? store.transactionStatus.core
    : store
