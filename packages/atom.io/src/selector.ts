import type { Serializable } from "~/packages/anvl/src/json"
import { stringifyJson } from "~/packages/anvl/src/json"

import type { FamilyMetadata, ReadonlyValueToken, SelectorToken } from "."
import type { Store } from "./internal"
import { selector__INTERNAL, IMPLICIT, deposit } from "./internal"
import type { ReadonlyTransactors, Transactors } from "./transaction"

export type SelectorOptions<T> = {
  key: string
  get: (readonlyTransactors: ReadonlyTransactors) => T
  set: (transactors: Transactors, newValue: T) => void
}
export type ReadonlySelectorOptions<T> = Omit<SelectorOptions<T>, `set`>

export function selector<T>(
  options: SelectorOptions<T>,
  store?: Store
): SelectorToken<T>
export function selector<T>(
  options: ReadonlySelectorOptions<T>,
  store?: Store
): ReadonlyValueToken<T>
export function selector<T>(
  options: ReadonlySelectorOptions<T> | SelectorOptions<T>,
  store: Store = IMPLICIT.STORE
): ReadonlyValueToken<T> | SelectorToken<T> {
  return selector__INTERNAL(options, undefined, store)
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
  options: SelectorFamilyOptions<T, K>,
  store?: Store
): (key: K) => SelectorToken<T>
export function selectorFamily<T, K extends Serializable>(
  options: ReadonlySelectorFamilyOptions<T, K>,
  store?: Store
): (key: K) => ReadonlyValueToken<T>
export function selectorFamily<T, K extends Serializable>(
  options: ReadonlySelectorFamilyOptions<T, K> | SelectorFamilyOptions<T, K>,
  store: Store = IMPLICIT.STORE
): (key: K) => ReadonlyValueToken<T> | SelectorToken<T> {
  return (key: K): ReadonlyValueToken<T> | SelectorToken<T> => {
    const subKey = stringifyJson(key)
    const family: FamilyMetadata = { key: options.key, subKey }
    const fullKey = `${options.key}__${subKey}`
    const existing =
      store.selectors.get(fullKey) ?? store.readonlySelectors.get(fullKey)
    if (existing) {
      return deposit(existing)
    }
    const readonlySelectorOptions: ReadonlySelectorOptions<T> = {
      key: fullKey,
      get: options.get(key),
    }
    if (!(`set` in options)) {
      return selector__INTERNAL<T>(
        {
          ...readonlySelectorOptions,
        },
        family,
        store
      )
    }
    return selector__INTERNAL<T>(
      {
        ...readonlySelectorOptions,
        set: options.set(key),
      },
      family,
      store
    )
  }
}
