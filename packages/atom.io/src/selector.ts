import type * as Rx from "rxjs"

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

export type SelectorFamily<T, K extends Serializable = Serializable> = ((
  key: K
) => SelectorToken<T>) & {
  key: string
  type: `selector_family`
  subject: Rx.Subject<SelectorToken<T>>
}

export type ReadonlySelectorFamily<T, K extends Serializable = Serializable> = ((
  key: K
) => ReadonlyValueToken<T>) & {
  key: string
  type: `readonly_selector_family`
  subject: Rx.Subject<ReadonlyValueToken<T>>
}

export function selectorFamily<T, K extends Serializable>(
  options: SelectorFamilyOptions<T, K>
): SelectorFamily<T, K>
export function selectorFamily<T, K extends Serializable>(
  options: ReadonlySelectorFamilyOptions<T, K>
): ReadonlySelectorFamily<T, K>
export function selectorFamily<T, K extends Serializable>(
  options: ReadonlySelectorFamilyOptions<T, K> | SelectorFamilyOptions<T, K>
): ReadonlySelectorFamily<T, K> | SelectorFamily<T, K> {
  return selectorFamily__INTERNAL(options)
}
