import type { ReadonlyValueToken, StateToken } from "."
import { getState, setState } from "."
import type { Store } from "./internal"
import { IMPLICIT } from "./internal"
import {
  abortTransaction,
  finishTransaction,
  startTransaction,
} from "./internal/transaction-internal"

export type ƒn = (...parameters: any[]) => any

export type Transactors = {
  get: <S>(state: ReadonlyValueToken<S> | StateToken<S>) => S
  set: <S>(state: StateToken<S>, newValue: S | ((oldValue: S) => S)) => void
}
export type ReadonlyTransactors = Pick<Transactors, `get`>

export type Action<ƒ extends ƒn> = (
  transactors: Transactors,
  ...parameters: Parameters<ƒ>
) => ReturnType<ƒ>

export type TransactionOptions<ƒ extends ƒn> = {
  key: string
  do: Action<ƒ>
}

export const transaction = <ƒ extends ƒn>(
  options: TransactionOptions<ƒ>,
  store: Store = IMPLICIT.STORE
): ((...parameters: Parameters<ƒ>) => ReturnType<ƒ>) & { key: string } =>
  Object.assign(
    (...parameters: Parameters<ƒ>) => {
      startTransaction(store)
      try {
        const result = options.do(
          {
            get: (token) => getState(token, store),
            set: (token, value) => setState(token, value, store),
          },
          ...parameters
        )
        finishTransaction(store)
        return result
      } catch (thrown) {
        abortTransaction(store)
        store.config.logger?.error(`Transaction ${options.key} failed`, thrown)
        throw thrown
      }
    },
    { key: options.key }
  )
