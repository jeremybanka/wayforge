import HAMT from "hamt_plus"
import * as Rx from "rxjs"

import type { Serializable } from "~/packages/anvl/src/json"
import { stringifyJson } from "~/packages/anvl/src/json"

import { deposit } from "./get"
import type { Store } from "./store"
import { IMPLICIT } from "./store"
import type { AtomToken, FamilyMetadata, ObserveState } from ".."
import { setState, subscribe } from ".."
import type { AtomFamilyOptions, AtomOptions } from "../atom"

export function atom__INTERNAL<T>(
  options: AtomOptions<T>,
  family?: FamilyMetadata,
  store: Store = IMPLICIT.STORE
): AtomToken<T> {
  if (HAMT.has(options.key, store.atoms)) {
    store.config.logger?.error?.(
      `Key "${options.key}" already exists in the store.`
    )
    return deposit(store.atoms.get(options.key))
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
  store.atoms = HAMT.set(options.key, newAtom, store.atoms)
  store.atomsAreDefault = HAMT.set(options.key, true, store.atomsAreDefault)
  store.valueMap = HAMT.set(options.key, initialValue, store.valueMap)
  const token = deposit(newAtom)
  const setSelf = (next) => setState(token, next, store)
  const onSet = (observe: ObserveState<T>) => subscribe(token, observe, store)
  options.effects?.forEach((effect) => effect({ setSelf, onSet }))
  return token
}

export function atomFamily__INTERNAL<T, K extends Serializable>(
  options: AtomFamilyOptions<T, K>,
  store: Store = IMPLICIT.STORE
) {
  return (key: K): AtomToken<T> => {
    const subKey = stringifyJson(key)
    const family: FamilyMetadata = { key: options.key, subKey }
    const fullKey = `${options.key}__${subKey}`
    const existing = store.atoms.get(fullKey)
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
  }
}
