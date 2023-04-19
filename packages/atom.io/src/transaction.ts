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

export type ObserveTransaction<ƒ extends ƒn> = (data: {
  params: Parameters<ƒ>
  output: ReturnType<ƒ>
  update: [string, { newValue: any; oldValue?: any }][]
}) => void

// begin ({open: true, closing: false, next: {…}, atomsUpdated: Set(0)})
// save parameters to transaction.params
// (skip emissions while transaction is open and closing is false)
// (make all updates to transaction.next instead of store)
// finishing transaction
// save output to transaction.output
// set transaction.closing to true
// build transaction update
// // get all atoms that were updated
// // map => [atom.key, {newValue: from next.valueMap, oldValue: from .valueMap}]
// save transaction.update
// set maps in transaction.next into store
// // for each item in transaction.update
