import HAMT from "hamt_plus"
import * as Rx from "rxjs"

import type { Serializable } from "~/packages/anvl/src/json"
import { stringifyJson } from "~/packages/anvl/src/json"

import type { AtomToken } from "."
import { setState } from "."
import { tokenize } from "./internal"
import type { Store } from "./internal/store"
import { IMPLICIT } from "./internal/store"

export type Effectors<T> = {
  setSelf: (newValue: T | ((oldValue: T) => T)) => void
  onSet: (callback: (options: { newValue: T; oldValue: T }) => void) => void
}

export type AtomEffect<T> = (tools: Effectors<T>) => void

export type AtomOptions<T> = {
  key: string
  default: T
  effects?: AtomEffect<T>[]
}

export const atom = <T>(
  options: AtomOptions<T>,
  store: Store = IMPLICIT.STORE
): AtomToken<T> => {
  const subject = new Rx.Subject<{ newValue: T; oldValue: T }>()
  const newAtom = { ...options, subject }
  store.atoms = HAMT.set(options.key, newAtom, store.atoms)
  store.valueMap = HAMT.set(options.key, options.default, store.valueMap)
  const token: AtomToken<T> = { ...newAtom, type: `atom` }
  const setSelf = <V extends T>(next: V | ((oldValue: T) => V)) =>
    setState<T, V>(token, next)
  const onSet = (callback: (change: { newValue: T; oldValue: T }) => void) => {
    newAtom.subject.subscribe(callback)
  }
  options.effects?.forEach((effect) => effect({ setSelf, onSet }))
  setSelf(options.default)
  return token
}

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
    const fullKey = `${options.key}__${stringifyJson(key)}`
    const existing = store.atoms.get(fullKey)
    if (existing) {
      return tokenize(existing)
    }
    return atom<T>(
      {
        key: fullKey,
        default:
          options.default instanceof Function
            ? options.default(key)
            : options.default,
        effects: options.effects?.(key),
      },
      store
    )
  }
