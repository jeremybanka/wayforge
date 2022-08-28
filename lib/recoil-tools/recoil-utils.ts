import { pipe } from "fp-ts/lib/function"
import type {
  AtomEffect,
  GetRecoilValue,
  RecoilState,
  RecoilValue,
  TransactionInterface_UNSTABLE as Transactors,
} from "recoil"

import type { Json, Primitive } from "../json"

export type Getter<T> = (a: RecoilValue<T>) => T

export type Setter<T> = (s: RecoilState<T>, u: T | ((currVal: T) => T)) => void

export type Resetter = (s: RecoilState<any>) => void

export type TransactionOperation<ARG = undefined, RETURN = void> = (
  transactors: Transactors,
  ...rest: ARG extends undefined ? [] : [argument: ARG]
) => RETURN

export const readonlyTransactors = (get: GetRecoilValue): Transactors => ({
  get,
  set: () => console.warn(`readonlyOperation: set() is not supported`),
  reset: () => console.warn(`readonlyOperation: reset() is not supported`),
})
