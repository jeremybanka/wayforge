import HAMT from "hamt_plus"

import { become } from "~/packages/anvl/src/function"

import type { Atom, Selector } from "."
import { withdraw, getState__INTERNAL } from "./get"
import { isDone, recall, markDone } from "./operation"
import type { Store } from "./store"
import { IMPLICIT } from "./store"
import type { StateToken } from ".."

export const propagateChanges = <T>(
  state: Atom<T> | Selector<T>,
  store: Store = IMPLICIT.STORE
): void => {
  const relatedStateKeys = store.selectorGraph.getRelations(state.key)
  store.config.logger?.info(
    `   ||`,
    `bumping`,
    relatedStateKeys.length,
    `states:`,
    relatedStateKeys.map(({ id }) => id)
  )
  if (store.operation.open) {
    store.config.logger?.info(`   ||`, `done:`, store.operation.done)
  }
  relatedStateKeys.forEach(({ id: stateKey }) => {
    if (isDone(stateKey, store)) {
      store.config.logger?.info(`   ||`, stateKey, `already done`)
      return
    }
    store.config.logger?.info(`->`, `bumping`, stateKey)
    store.valueMap = HAMT.remove(stateKey, store.valueMap)
    // }
    const state =
      HAMT.get(stateKey, store.selectors) ??
      HAMT.get(stateKey, store.readonlySelectors)
    const newValue = getState__INTERNAL(state, store)
    store.config.logger?.info(`   <-`, stateKey, `became`, newValue)
    const oldValue = recall(state, store)
    state.subject.next({ newValue, oldValue })
    markDone(stateKey, store)
    if (`set` in state) propagateChanges(state, store)
  })
}

export const setAtomState = <T>(
  atom: Atom<T>,
  next: T | ((oldValue: T) => T),
  store: Store = IMPLICIT.STORE
): void => {
  const oldValue = getState__INTERNAL(atom, store)
  const newValue = become(next)(oldValue)
  store.config.logger?.info(
    `->`,
    `setting atom`,
    `"${atom.key}"`,
    `to`,
    newValue
  )
  store.valueMap = HAMT.set(atom.key, newValue, store.valueMap)
  markDone(atom.key, store)
  atom.subject.next({ newValue, oldValue })
  store.config.logger?.info(`   ||`, `propagating change to`, `"${atom.key}"`)
  propagateChanges(atom, store)
}
export const setSelectorState = <T>(
  selector: Selector<T>,
  next: T | ((oldValue: T) => T),
  store: Store = IMPLICIT.STORE
): void => {
  const oldValue = getState__INTERNAL(selector, store)
  const newValue = become(next)(oldValue)

  store.config.logger?.info(
    `->`,
    `setting selector`,
    `"${selector.key}"`,
    `to`,
    newValue
  )
  store.config.logger?.info(
    `   ||`,
    `propagating change to`,
    `"${selector.key}"`
  )

  selector.set(newValue)
  markDone(selector.key, store)
  propagateChanges(selector, store)
}
export const setState__INTERNAL = <T>(
  token: StateToken<T>,
  value: T | ((oldValue: T) => T),
  store: Store = IMPLICIT.STORE
): void => {
  const state = withdraw<T>(token, store)
  if (`set` in state) {
    setSelectorState(state, value, store)
  } else {
    setAtomState(state, value, store)
  }
}
