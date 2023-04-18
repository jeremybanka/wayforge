import type { ReadonlyValueToken, StateToken } from "."
import { transaction__INTERNAL } from "./internal"

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

export function transaction<ƒ extends ƒn>(
  options: TransactionOptions<ƒ>
): ((...parameters: Parameters<ƒ>) => ReturnType<ƒ>) & { key: string } {
  return transaction__INTERNAL(options)
}
