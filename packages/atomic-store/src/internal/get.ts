import HAMT from "hamt_plus"

import type { Atom, ReadonlySelector, Selector } from "."
import type { Store } from "./store"
import { IMPLICIT } from "./store"
import type { ReadonlyValueToken, StateToken } from ".."

export const getAtomState = <T>(
  atom: Atom<T>,
  store: Store = IMPLICIT.STORE
): T => {
  const value = HAMT.get(atom.key, store.valueMap)
  return value
}

export const getSelectorState = <T>(
  selector: ReadonlySelector<T> | Selector<T>
): T => selector.get()

export function detokenize<T>(
  token: ReadonlyValueToken<T> | StateToken<T>,
  store: Store
): Atom<T> | Selector<T>
export function detokenize<T>(
  token: ReadonlyValueToken<T> | StateToken<T>,
  store: Store
): ReadonlySelector<T>
export function detokenize<T>(
  token: ReadonlyValueToken<T> | StateToken<T>,
  store: Store
): Atom<T> | ReadonlySelector<T> | Selector<T> {
  return (
    HAMT.get(token.key, store.atoms) ??
    HAMT.get(token.key, store.selectors) ??
    HAMT.get(token.key, store.readonlySelectors)
  )
}

export const getState__INTERNAL = <T>(
  state: Atom<T> | Selector<T>,
  store: Store = IMPLICIT.STORE
): T => {
  if (`get` in state) {
    return getSelectorState(state)
  }
  return getAtomState(state, store)
}
