import { capitalize } from "~/packages/anvl/src/string/capitalize"

import {
  IMPLICIT,
  closeOperation,
  openOperation,
  getState__INTERNAL,
  setState__INTERNAL,
  isAtomDefault,
  isSelectorDefault,
  withdraw,
} from "./internal"
import * as __INTERNAL__ from "./internal"
import type { Store } from "./internal/store"

export * from "./atom"
export * from "./logger"
export * from "./selector"
export * from "./silo"
export * from "./subscribe"
export * from "./timeline"
export * from "./transaction"
export { __INTERNAL__ }
export type { Store } from "./internal/store"
export type { Serializable } from "~/packages/anvl/src/json"

export type AtomToken<_> = {
  key: string
  type: `atom`
  family?: FamilyMetadata
  __brand?: _
}
export type SelectorToken<_> = {
  key: string
  type: `selector`
  family?: FamilyMetadata
  __brand?: _
}
export type StateToken<T> = AtomToken<T> | SelectorToken<T>

export type ReadonlySelectorToken<_> = {
  key: string
  type: `readonly_selector`
  family?: FamilyMetadata
  __brand?: _
}

export type FamilyMetadata = {
  key: string
  subKey: string
}

export const getState = <T>(
  token: ReadonlySelectorToken<T> | StateToken<T>,
  store: Store = IMPLICIT.STORE
): T => {
  const state = withdraw<T>(token, store)
  if (state === null) {
    throw new Error(
      `${capitalize(token.type)} "${token.key}" not found in store "${
        store.config.name
      }".`
    )
  }
  return getState__INTERNAL(state, store)
}

export const setState = <T, New extends T>(
  token: StateToken<T>,
  value: New | ((oldValue: T) => New),
  store: Store = IMPLICIT.STORE
): void => {
  try {
    openOperation(token, store)
  } catch (thrown) {
    if (!(typeof thrown === `symbol`)) {
      throw thrown
    }
    return
  }
  const state = withdraw(token, store)
  if (state === null) {
    throw new Error(
      `${capitalize(token.type)} "${token.key}" not found in store "${
        store.config.name
      }".`
    )
  }
  setState__INTERNAL(state, value, store)
  closeOperation(store)
}

export const isDefault = (
  token: ReadonlySelectorToken<unknown> | StateToken<unknown>,
  store: Store = IMPLICIT.STORE
): boolean =>
  token.type === `atom`
    ? isAtomDefault(token.key, store)
    : isSelectorDefault(token.key, store)
