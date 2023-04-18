import type { Serializable } from "~/packages/anvl/src/json"
import { stringifyJson } from "~/packages/anvl/src/json"

import type { AtomToken, FamilyMetadata } from "."
import { deposit } from "./internal"
import { atom__INTERNAL } from "./internal/atom-internal"
import type { Store } from "./internal/store"
import { IMPLICIT } from "./internal/store"

export type Effectors<T> = {
  setSelf: <V extends T>(next: V | ((oldValue: T) => V)) => void
  onSet: (callback: (options: { newValue: T; oldValue: T }) => void) => void
}

export type AtomEffect<T> = (tools: Effectors<T>) => void

export type AtomOptions<T> = {
  key: string
  default: T | (() => T)
  effects?: AtomEffect<T>[]
}

export const atom = <T>(
  options: AtomOptions<T>,
  store: Store = IMPLICIT.STORE
): AtomToken<T> => atom__INTERNAL(options, undefined, store)

export type AtomFamilyOptions<T, K extends Serializable> = {
  key: string
  default: T | ((key: K) => T)
  effects?: (key: K) => AtomEffect<T>[]
}

export const atomFamily =
  <T, K extends Serializable>(
    options: AtomFamilyOptions<T, K>,
    store: Store = IMPLICIT.STORE
  ) =>
  (key: K): AtomToken<T> => {
    const subKey = stringifyJson(key)
    const family: FamilyMetadata = { key: options.key, subKey }
    const fullKey = `${options.key}__${subKey}`
    const existing = store.atoms.get(fullKey)
    if (existing) {
      store.config.logger?.error?.(
        `Key "${fullKey}" already exists in the store. This is likely due to reloading a module in development.`
      )
      return deposit(existing)
    }
    return atom__INTERNAL<T>(
      {
        key: fullKey,
        default:
          options.default instanceof Function
            ? options.default(key)
            : options.default,
        effects: options.effects?.(key),
      },
      family,
      store
    )
  }
