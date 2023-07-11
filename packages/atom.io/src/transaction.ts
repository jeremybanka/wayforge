import type * as Rx from "rxjs"

import type { ƒn } from "~/packages/anvl/src/function"

import type { ReadonlySelectorToken, StateToken, TransactionToken } from "."
import type { Store, TransactionUpdate } from "./internal"
import { IMPLICIT, transaction__INTERNAL, withdraw } from "./internal"

export type Transactors = {
  get: <S>(state: ReadonlySelectorToken<S> | StateToken<S>) => S
  set: <S>(state: StateToken<S>, newValue: S | ((oldValue: S) => S)) => void
}
export type ReadonlyTransactors = Pick<Transactors, `get`>

export type Read<ƒ extends ƒn> = (
  transactors: ReadonlyTransactors,
  ...parameters: Parameters<ƒ>
) => ReturnType<ƒ>

export type Write<ƒ extends ƒn> = (
  transactors: Transactors,
  ...parameters: Parameters<ƒ>
) => ReturnType<ƒ>

export type TransactionOptions<ƒ extends ƒn> = {
  key: string
  do: Write<ƒ>
}

export type Transaction<ƒ extends ƒn> = {
  key: string
  type: `transaction`
  run: (...parameters: Parameters<ƒ>) => ReturnType<ƒ>
  install: (store: Store) => void
  subject: Rx.Subject<TransactionUpdate<ƒ>>
}
export type TransactionIO<Token extends TransactionToken<any>> =
  Token extends TransactionToken<infer ƒ> ? ƒ : never

export function transaction<ƒ extends ƒn>(
  options: TransactionOptions<ƒ>
): TransactionToken<ƒ> {
  return transaction__INTERNAL(options)
}

export const runTransaction =
  <ƒ extends ƒn>(token: TransactionToken<ƒ>, store: Store = IMPLICIT.STORE) =>
  (...parameters: Parameters<ƒ>): ReturnType<ƒ> => {
    const tx = withdraw(token, store)
    if (tx) {
      return tx.run(...parameters)
    }
    throw new Error(
      `Cannot run transaction "${token.key}": transaction not found in store "${store.config.name}".`
    )
  }
