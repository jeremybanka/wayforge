import HAMT from "hamt_plus"

import type { Atom, ReadonlySelector, Selector } from "."
import type { Store } from "./store"
import { IMPLICIT } from "./store"

export const startAction = (store: Store): void => {
  store.operation = {
    open: true,
    done: new Set(),
    prev: store.valueMap,
  }
  store.config.logger?.info(`⭕`, `operation start`)
}
export const finishAction = (store: Store): void => {
  store.operation = { open: false }
  store.config.logger?.info(`🔴`, `operation done`)
}

export const isDone = (key: string, store: Store = IMPLICIT.STORE): boolean => {
  if (!store.operation.open) {
    store.config.logger?.warn(
      `isDone called outside of an action. This is probably a bug.`
    )
    return true
  }
  return store.operation.done.has(key)
}
export const markDone = (key: string, store: Store = IMPLICIT.STORE): void => {
  if (!store.operation.open) {
    store.config.logger?.warn(
      `markDone called outside of an action. This is probably a bug.`
    )
    return
  }
  store.operation.done.add(key)
}
export const recallState = <T>(
  state: Atom<T> | ReadonlySelector<T> | Selector<T>,
  store: Store = IMPLICIT.STORE
): T => {
  if (!store.operation.open) {
    store.config.logger?.warn(
      `recall called outside of an action. This is probably a bug.`
    )
    return HAMT.get(state.key, store.valueMap)
  }
  return HAMT.get(state.key, store.operation.prev)
}
