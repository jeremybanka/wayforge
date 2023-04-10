import HAMT from "hamt_plus"
import * as Rx from "rxjs"

import { become } from "~/packages/anvl/src/function"

import type { ReadonlyValueToken, SelectorToken, StateToken } from "."
import { getState } from "."
import type { Selector } from "./internal"
import { setState__INTERNAL } from "./internal/set"
import type { Store } from "./internal/store"
import { IMPLICIT } from "./internal/store"
import type { ReadonlyTransactors, Transactors } from "./transact"

export type SelectorOptions<T> = {
  key: string
  get: (readonlyTransactors: ReadonlyTransactors) => T
  set: (newValue: T | ((oldValue: T) => T), transactors: Transactors) => void
}
export type ReadonlySelectorOptions<T> = Omit<SelectorOptions<T>, `set`>

export function selector<T>(
  options: SelectorOptions<T>,
  store?: Store
): SelectorToken<T>
export function selector<T>(
  options: ReadonlySelectorOptions<T>,
  store?: Store
): ReadonlyValueToken<T>
export function selector<T>(
  options: ReadonlySelectorOptions<T> | SelectorOptions<T>,
  store: Store = IMPLICIT.STORE
): ReadonlyValueToken<T> | SelectorToken<T> {
  if (HAMT.has(options.key, store.selectors)) {
    throw new Error(`Key "${options.key}" already exists in the store.`)
  }

  const subject = new Rx.Subject<T>()

  const { getState: get, setState: set } = registerSelector(options.key, store)
  const getSelf = () => options.get({ get })

  if (!(`set` in options)) {
    const readonlySelector = {
      ...options,
      subject,
      get: getSelf,
    }
    store.readonlySelectors = HAMT.set(
      options.key,
      readonlySelector,
      store.readonlySelectors
    )
    const initialValue = getSelf()
    console.log(`   ✨`, options.key, `=`, initialValue)
    return { ...readonlySelector, type: `readonly_selector` }
  }

  const setSelf = (next: T | ((oldValue: T) => T)): void => {
    console.log(`${options.key}.set`, next)
    const newValue = become(next)(getSelf)
    store.done.add(options.key)
    subject.next(newValue)
    options.set(newValue, { get, set })
  }

  const mySelector: Selector<T> = {
    ...options,
    subject,
    get: getSelf,
    set: setSelf,
  }
  store.selectors = HAMT.set(options.key, mySelector, store.selectors)
  const initialValue = getSelf()
  console.log(`   ✨`, options.key, `=`, initialValue)
  return { ...mySelector, type: `selector` }
}

export const registerSelector = (
  selectorKey: string,
  store: Store = IMPLICIT.STORE
): {
  getState: <T>(state: ReadonlyValueToken<T> | StateToken<T>) => T
  setState: <T>(state: StateToken<T>, value: T) => void
} => ({
  getState: (state) => {
    const isRegistered = store.selectorGraph
      .getRelatedIds(selectorKey)
      .includes(state.key)
    if (isRegistered) {
      console.log(`   ||`, selectorKey, `<-`, state.key)
    } else {
      console.log(`🔌 registerSelector`, state.key, `->`, selectorKey)
      store.selectorGraph = store.selectorGraph.set(selectorKey, state.key)
    }
    const currentValue = getState(state, store)
    console.log(`   ||`, state.key, `=`, currentValue)
    return currentValue
  },
  setState: (token, newValue) => {
    store.selectorGraph.set(token.key, selectorKey)
    setState__INTERNAL(token, newValue, store)
  },
})
