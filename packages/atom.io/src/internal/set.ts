import HAMT from "hamt_plus"

import { become } from "~/packages/anvl/src/function"

import type { Atom, Selector } from "."
import { withdraw, getState__INTERNAL } from "./get"
import { isDone, recall, markDone } from "./operation"
import type { Store } from "./store"
import { IMPLICIT } from "./store"
import type { StateToken } from ".."

export const propagateDown = <T>(
  state: Atom<T> | Selector<T>,
  store: Store = IMPLICIT.STORE
): void => {
  const stateRelations = store.selectorGraph.getRelations(state.key)
  const downstream = stateRelations.filter(({ source }) => source === state.key)
  const downstreamKeys = downstream.map(({ id }) => id)
  store.config.logger?.info(
    `   || ${downstreamKeys.length} downstream:`,
    downstreamKeys
  )
  if (store.operation.open) {
    store.config.logger?.info(`   ||`, [...store.operation.done], `already done`)
  }
  downstream.forEach(({ id: stateKey }) => {
    if (isDone(stateKey, store)) {
      store.config.logger?.info(`   || ${stateKey} already done`)
      return
    }
    store.config.logger?.info(`-> bumping ${stateKey}`)
    const state =
      HAMT.get(stateKey, store.selectors) ??
      HAMT.get(stateKey, store.readonlySelectors)
    if (!state) {
      store.config.logger?.info(
        `   || ${stateKey} is an atom, and can't be downstream`
      )
      return
    }
    store.valueMap = HAMT.remove(stateKey, store.valueMap)
    const newValue = getState__INTERNAL(state, store)
    store.config.logger?.info(`   <- ${stateKey} became ${newValue}`)
    const oldValue = recall(state, store)
    state.subject.next({ newValue, oldValue })
    markDone(stateKey, store)
    if (`set` in state) propagateDown(state, store)
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
  store.config.logger?.info(
    `   ||`,
    `propagating change made to`,
    `"${atom.key}"`
  )
  propagateDown(atom, store)
}
export const setSelectorState = <T>(
  selector: Selector<T>,
  next: T | ((oldValue: T) => T),
  store: Store = IMPLICIT.STORE
): void => {
  const oldValue = getState__INTERNAL(selector, store)
  const newValue = become(next)(oldValue)

  store.config.logger?.info(`-> setting selector "${selector.key}" to`, newValue)
  store.config.logger?.info(`   || propagating change made to "${selector.key}"`)

  selector.set(newValue)
  propagateDown(selector, store)
}
export const setState__INTERNAL = <T>(
  state: Atom<T> | Selector<T>,
  value: T | ((oldValue: T) => T),
  store: Store = IMPLICIT.STORE
): void => {
  if (`set` in state) {
    setSelectorState(state, value, store)
  } else {
    setAtomState(state, value, store)
  }
}
