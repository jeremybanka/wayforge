import type { Serializable } from "~/packages/anvl/src/json"

import type { ReadonlyValueToken, SelectorToken } from "."
import { selectorFamily__INTERNAL, selector__INTERNAL } from "./internal"
import type { ReadonlyTransactors, Transactors } from "./transaction"

export type SelectorOptions<T> = {
  key: string
  get: (readonlyTransactors: ReadonlyTransactors) => T
  set: (transactors: Transactors, newValue: T) => void
}
export type ReadonlySelectorOptions<T> = Omit<SelectorOptions<T>, `set`>

export function selector<T>(options: SelectorOptions<T>): SelectorToken<T>
export function selector<T>(
  options: ReadonlySelectorOptions<T>
): ReadonlyValueToken<T>
export function selector<T>(
  options: ReadonlySelectorOptions<T> | SelectorOptions<T>
): ReadonlyValueToken<T> | SelectorToken<T> {
  return selector__INTERNAL(options)
}

export type SelectorFamilyOptions<T, K extends Serializable> = {
  key: string
  get: (key: K) => (readonlyTransactors: ReadonlyTransactors) => T
  set: (key: K) => (transactors: Transactors, newValue: T) => void
}
export type ReadonlySelectorFamilyOptions<T, K extends Serializable> = Omit<
  SelectorFamilyOptions<T, K>,
  `set`
>

export function selectorFamily<T, K extends Serializable>(
  options: SelectorFamilyOptions<T, K>
): (key: K) => SelectorToken<T>
export function selectorFamily<T, K extends Serializable>(
  options: ReadonlySelectorFamilyOptions<T, K>
): (key: K) => ReadonlyValueToken<T>
export function selectorFamily<T, K extends Serializable>(
  options: ReadonlySelectorFamilyOptions<T, K> | SelectorFamilyOptions<T, K>
): (key: K) => ReadonlyValueToken<T> | SelectorToken<T> {
  return selectorFamily__INTERNAL(options)
}
