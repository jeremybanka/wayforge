import HAMT from "hamt_plus"
import * as Rx from "rxjs"

import type { Serializable } from "~/packages/anvl/src/json"
import { stringifyJson } from "~/packages/anvl/src/json"

import { deposit, withdraw } from "./get"
import { markAtomAsDefault } from "./is-default"
import { cacheValue, hasKeyBeenUsed, storeAtom } from "./operation"
import type { Store } from "./store"
import { IMPLICIT } from "./store"
import { target } from "./transaction-internal"
import type { AtomToken, FamilyMetadata, UpdateHandler } from ".."
import { setState, subscribe } from ".."
import type { AtomFamily, AtomFamilyOptions, AtomOptions } from "../atom"

export function atom__INTERNAL<T>(
  options: AtomOptions<T>,
  family?: FamilyMetadata,
  store: Store = IMPLICIT.STORE
): AtomToken<T> {
  const core = target(store)
  if (hasKeyBeenUsed(options.key, store)) {
    store.config.logger?.error?.(
      `Key "${options.key}" already exists in the store.`
    )
    return deposit(core.atoms.get(options.key))
  }
  const subject = new Rx.Subject<{ newValue: T; oldValue: T }>()
  const newAtom = {
    ...options,
    subject,
    type: `atom`,
    ...(family && { family }),
  } as const
  const initialValue =
    options.default instanceof Function ? options.default() : options.default
  storeAtom(newAtom, store)
  markAtomAsDefault(options.key, store)
  cacheValue(options.key, initialValue, store)
  const token = deposit(newAtom)
  const setSelf = (next) => setState(token, next, store)
  const onSet = (handle: UpdateHandler<T>) => subscribe(token, handle, store)
  options.effects?.forEach((effect) => effect({ setSelf, onSet }))
  return token
}

export function atomFamily__INTERNAL<T, K extends Serializable>(
  options: AtomFamilyOptions<T, K>,
  store: Store = IMPLICIT.STORE
): AtomFamily<T, K> {
  return Object.assign(
    (key: K): AtomToken<T> => {
      const subKey = stringifyJson(key)
      const family: FamilyMetadata = { key: options.key, subKey }
      const fullKey = `${options.key}__${subKey}`
      const existing = withdraw({ key: fullKey, type: `atom` }, store)
      if (existing) {
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
    },
    {
      key: options.key,
    }
  )
}
