import HAMT from "hamt_plus"
import * as Rx from "rxjs"

import type { AtomToken } from "."
import { setState } from "."
import { getState__INTERNAL } from "./internal/get"
import type { Store } from "./internal/store"
import { IMPLICIT } from "./internal/store"

export const atom = <T>(
  options: { key: string; default: T },
  store: Store = IMPLICIT.STORE
): AtomToken<T> => {
  const subject = new Rx.Subject<T>()
  const newAtom = { ...options, subject }
  store.atoms = HAMT.set(options.key, newAtom, store.atoms)
  const token: AtomToken<T> = { ...newAtom, type: `atom` }
  getState__INTERNAL(newAtom, store)
  setState(token, options.default)
  return token
}
