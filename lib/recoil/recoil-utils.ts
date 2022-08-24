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

export const localStorageEffect: <T extends Json | Primitive>(
  key: string
) => AtomEffect<T> =
  (key) =>
  ({ setSelf, onSet }) => {
    const savedValue = localStorage.getItem(key)
    if (savedValue != null) {
      setSelf(JSON.parse(savedValue))
    }

    onSet((newValue, _, isReset) => {
      isReset
        ? localStorage.removeItem(key)
        : localStorage.setItem(key, JSON.stringify(newValue))
    })
  }
