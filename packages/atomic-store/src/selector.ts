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
  set: (transactors: Transactors, newValue: T) => void
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

  const { get, set } = registerSelector(options.key, store)
  const getSelf = () => {
    const value = options.get({ get })
    store.valueMap = HAMT.set(options.key, value, store.valueMap)
    return value
  }

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
    store.config.logger?.info(`   ✨`, options.key, `=`, initialValue)
    return { ...readonlySelector, type: `readonly_selector` }
  }

  const setSelf = (next: T | ((oldValue: T) => T)): void => {
    store.config.logger?.info(`${options.key}.set`, next)
    const newValue = become(next)(getSelf)
    subject.next(newValue)
    store.valueMap = HAMT.set(options.key, newValue, store.valueMap)
    options.set({ get, set }, newValue)
  }

  const mySelector: Selector<T> = {
    ...options,
    subject,
    get: getSelf,
    set: setSelf,
  }
  store.selectors = HAMT.set(options.key, mySelector, store.selectors)
  const initialValue = getSelf()
  store.config.logger?.info(`   ✨`, options.key, `=`, initialValue)
  return { ...mySelector, type: `selector` }
}

export const registerSelector = (
  selectorKey: string,
  store: Store = IMPLICIT.STORE
): Transactors => ({
  get: (state) => {
    const isRegistered = store.selectorGraph
      .getRelatedIds(selectorKey)
      .includes(state.key)
    if (isRegistered) {
      store.config.logger?.info(`   ||`, selectorKey, `<-`, state.key)
    } else {
      store.config.logger?.info(
        `🔌 registerSelector`,
        state.key,
        `->`,
        selectorKey
      )
      store.selectorGraph = store.selectorGraph.set(selectorKey, state.key)
    }
    const currentValue = getState(state, store)
    store.config.logger?.info(`   ||`, state.key, `=`, currentValue)
    return currentValue
  },
  set: (token, newValue) => {
    store.selectorGraph.set(token.key, selectorKey)
    setState__INTERNAL(token, newValue, store)
  },
})
