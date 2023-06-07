import type * as Rx from "rxjs"

import type { ReadonlySelectorToken, StateToken, TransactionToken } from "."
import type { Store, TransactionUpdate } from "./internal"
import { IMPLICIT, transaction__INTERNAL, withdraw } from "./internal"

export type ƒn = (...parameters: any[]) => any

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
  (...parameters: Parameters<ƒ>): ReturnType<ƒ> =>
    withdraw(token, store).run(...parameters)
