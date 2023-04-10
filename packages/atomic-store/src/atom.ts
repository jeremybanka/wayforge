import HAMT from "hamt_plus"
import * as Rx from "rxjs"

import { become } from "~/packages/anvl/src/function"
import type { Serializable } from "~/packages/anvl/src/json"
import { stringifyJson } from "~/packages/anvl/src/json"

import type { AtomToken } from "."
import { setState } from "."
import { tokenize } from "./internal"
import type { Store } from "./internal/store"
import { IMPLICIT } from "./internal/store"

export type AtomOptions<T> = {
  key: string
  default: T
}

export const atom = <T>(
  options: AtomOptions<T>,
  store: Store = IMPLICIT.STORE
): AtomToken<T> => {
  const subject = new Rx.Subject<T>()
  const newAtom = { ...options, subject }
  store.atoms = HAMT.set(options.key, newAtom, store.atoms)
  const token: AtomToken<T> = { ...newAtom, type: `atom` }
  setState(token, options.default)
  return token
}

export type AtomFamilyOptions<T, K extends Serializable> = {
  key: string
  default: T | ((key: K) => T)
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
      },
      store
    )
  }
