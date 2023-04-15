import { pipe } from "fp-ts/function"
import HAMT from "hamt_plus"

import type { Atom, ReadonlySelector, Selector } from "."
import type { Store } from "./store"
import { IMPLICIT } from "./store"
import type {
  AtomToken,
  ReadonlyValueToken,
  SelectorToken,
  StateToken,
} from ".."

export const getCachedState = <T>(
  state: Atom<T> | ReadonlySelector<T> | Selector<T>,
  store: Store = IMPLICIT.STORE
): T => {
  const path = []
  if (`default` in state) {
    const atomKey = state.key
    store.selectorAtoms = pipe(store.selectorAtoms, (oldValue) => {
      let newValue = oldValue
      for (const selectorKey of path) {
        newValue = newValue.set(selectorKey, atomKey)
      }
      return newValue
    })
  }
  const value = HAMT.get(state.key, store.valueMap)
  return value
}

export const getSelectorState = <T>(
  selector: ReadonlySelector<T> | Selector<T>
): T => selector.get()

export function lookup(
  key: string,
  store: Store
): AtomToken<unknown> | ReadonlyValueToken<unknown> | SelectorToken<unknown> {
  const type = HAMT.has(key, store.atoms)
    ? `atom`
    : HAMT.has(key, store.selectors)
    ? `selector`
    : `readonly_selector`
  return { key, type }
}

export function withdraw<T>(token: AtomToken<T>, store: Store): Atom<T>
export function withdraw<T>(token: SelectorToken<T>, store: Store): Selector<T>
export function withdraw<T>(
  token: StateToken<T>,
  store: Store
): Atom<T> | Selector<T>
export function withdraw<T>(
  token: ReadonlyValueToken<T>,
  store: Store
): ReadonlySelector<T>
export function withdraw<T>(
  token: ReadonlyValueToken<T> | StateToken<T>,
  store: Store
): Atom<T> | ReadonlySelector<T> | Selector<T>
export function withdraw<T>(
  token: ReadonlyValueToken<T> | StateToken<T>,
  store: Store
): Atom<T> | ReadonlySelector<T> | Selector<T> {
  return (
    HAMT.get(token.key, store.atoms) ??
    HAMT.get(token.key, store.selectors) ??
    HAMT.get(token.key, store.readonlySelectors)
  )
}

export function deposit<T>(state: Atom<T>): AtomToken<T>
export function deposit<T>(state: Selector<T>): SelectorToken<T>
export function deposit<T>(state: Atom<T> | Selector<T>): StateToken<T>
export function deposit<T>(state: ReadonlySelector<T>): ReadonlyValueToken<T>
export function deposit<T>(
  state: Atom<T> | ReadonlySelector<T> | Selector<T>
): ReadonlyValueToken<T> | StateToken<T>
export function deposit<T>(
  state: Atom<T> | ReadonlySelector<T> | Selector<T>
): ReadonlyValueToken<T> | StateToken<T> {
  if (`get` in state) {
    if (`set` in state) {
      return { key: state.key, type: `selector` }
    }
    return { key: state.key, type: `readonly_selector` }
  }
  return { key: state.key, type: `atom` }
}

export const getState__INTERNAL = <T>(
  state: Atom<T> | ReadonlySelector<T> | Selector<T>,
  store: Store = IMPLICIT.STORE
): T => {
  if (HAMT.has(state.key, store.valueMap)) {
    store.config.logger?.info(`   💬 read "${state.key}"`)
    return getCachedState(state, store)
  }
  if (`get` in state) {
    store.config.logger?.info(`   🧮 calc "${state.key}"`)
    return getSelectorState(state)
  }
  store.config.logger?.error(
    `Attempted to get atom "${state.key}", which was never initialized in store "${store.config.name}".`
  )
  return state.default
}
