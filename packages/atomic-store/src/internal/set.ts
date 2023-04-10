import HAMT from "hamt_plus"

import type { Atom, Selector } from "."
import { detokenize, getState__INTERNAL } from "./get"
import type { Store } from "./store"
import { IMPLICIT } from "./store"
import type { StateToken } from ".."

export const propagateChanges = <T>(
  state: Atom<T> | Selector<T>,
  store: Store = IMPLICIT.STORE
): void => {
  const relatedStateKeys = store.selectorGraph.getRelations(state.key)
  console.log(
    `   ||`,
    `bumping`,
    relatedStateKeys.length,
    `states:`,
    relatedStateKeys.map(({ id }) => id)
  )
  console.log(`   ||`, `done:`, store.done)
  relatedStateKeys.forEach(({ id: stateKey }) => {
    if (store.done.has(stateKey)) {
      console.log(`   ||`, stateKey, `already done`)
      return
    }
    console.log(`->`, `bumping`, stateKey)
    const state =
      HAMT.get(stateKey, store.selectors) ??
      HAMT.get(stateKey, store.atoms) ??
      HAMT.get(stateKey, store.readonlySelectors)
    const newValue = getState__INTERNAL(state, store)
    console.log(`   <-`, stateKey, `became`, newValue)
    state.subject.next(newValue)
    store.done.add(stateKey)
    propagateChanges(state, store)
  })
}

export const setAtomState = <T>(
  atom: Atom<T>,
  value: T,
  store: Store = IMPLICIT.STORE
): void => {
  console.log(`->`, `setting atom`, `"${atom.key}"`, `to`, value)
  store.valueMap = HAMT.set(atom.key, value, store.valueMap)
  store.done.add(atom.key)
  atom.subject.next(value)
  console.log(`   ||`, `propagating change to`, `"${atom.key}"`)
  propagateChanges(atom, store)
}
export const setSelectorState = <T>(
  selector: Selector<T>,
  value: T,
  store: Store = IMPLICIT.STORE
): void => {
  console.log(`->`, `setting selector`, `"${selector.key}"`, `to`, value)
  selector.set(value)
  store.done.add(selector.key)
  console.log(`   ||`, `propagating change to`, `"${selector.key}"`)
  propagateChanges(selector, store)
}
export const setState__INTERNAL = <T>(
  token: StateToken<T>,
  value: T,
  store: Store = IMPLICIT.STORE
): void => {
  const state = detokenize<T>(token, store)
  if (`set` in state) {
    setSelectorState(state, value, store)
  } else {
    setAtomState(state, value, store)
  }
}
