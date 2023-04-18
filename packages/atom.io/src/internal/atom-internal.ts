import HAMT from "hamt_plus"
import * as Rx from "rxjs"

import { deposit } from "./get"
import type { Store } from "./store"
import { IMPLICIT } from "./store"
import type { AtomToken, FamilyMetadata, ObserveState } from ".."
import { setState, subscribe } from ".."
import type { AtomOptions } from "../atom"

export const atom__INTERNAL = <T>(
  options: AtomOptions<T>,
  family?: FamilyMetadata,
  store: Store = IMPLICIT.STORE
): AtomToken<T> => {
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
