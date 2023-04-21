import HAMT from "hamt_plus"

import type { Atom, ReadonlySelector, Selector } from "."
import { target, isValueCached, readCachedValue } from "."
import type { Store } from "./store"
import { IMPLICIT } from "./store"
import type {
  AtomToken,
  ReadonlyValueToken,
  SelectorToken,
  StateToken,
  Transaction,
  TransactionToken,
  ƒn,
} from ".."

export const computeSelectorState = <T>(
  selector: ReadonlySelector<T> | Selector<T>
): T => selector.get()

export function lookup(
  key: string,
  store: Store
): AtomToken<unknown> | ReadonlyValueToken<unknown> | SelectorToken<unknown> {
  const core = target(store)
  const type = HAMT.has(key, core.atoms)
    ? `atom`
    : HAMT.has(key, core.selectors)
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
  token: TransactionToken<T>,
  store: Store
): Transaction<T extends ƒn ? T : never>
export function withdraw<T>(
  token: ReadonlyValueToken<T> | StateToken<T>,
  store: Store
): Atom<T> | ReadonlySelector<T> | Selector<T>
export function withdraw<T>(
  token: ReadonlyValueToken<T> | StateToken<T> | TransactionToken<T>,
  store: Store
):
  | Atom<T>
  | ReadonlySelector<T>
  | Selector<T>
  | Transaction<T extends ƒn ? T : never> {
  const core = target(store)
  return (
    HAMT.get(token.key, core.atoms) ??
    HAMT.get(token.key, core.selectors) ??
    HAMT.get(token.key, core.readonlySelectors) ??
    HAMT.get(token.key, core.actions)
  )
}

export function deposit<T>(state: Atom<T>): AtomToken<T>
export function deposit<T>(state: Selector<T>): SelectorToken<T>
export function deposit<T>(state: Atom<T> | Selector<T>): StateToken<T>
export function deposit<T>(state: ReadonlySelector<T>): ReadonlyValueToken<T>
export function deposit<T>(
  state: Transaction<T extends ƒn ? T : never>
): TransactionToken<T>
export function deposit<T>(
  state: Atom<T> | ReadonlySelector<T> | Selector<T>
): ReadonlyValueToken<T> | StateToken<T>
export function deposit<T>(
  state:
    | Atom<T>
    | ReadonlySelector<T>
    | Selector<T>
    | Transaction<T extends ƒn ? T : never>
): ReadonlyValueToken<T> | StateToken<T> | TransactionToken<T> {
  return {
    key: state.key,
    type: state.type,
    ...(`family` in state && { family: state.family }),
  }
}

export const getState__INTERNAL = <T>(
  state: Atom<T> | ReadonlySelector<T> | Selector<T>,
  store: Store = IMPLICIT.STORE
): T => {
  if (isValueCached(state.key, store)) {
    store.config.logger?.info(`>> read "${state.key}"`)
    return readCachedValue(state.key, store)
  }
  if (`get` in state) {
    store.config.logger?.info(`-> calc "${state.key}"`)
    return computeSelectorState(state)
  }
  store.config.logger?.error(
    `Attempted to get atom "${state.key}", which was never initialized in store "${store.config.name}".`
  )
  return state.default
}
