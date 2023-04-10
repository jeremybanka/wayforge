import HAMT from "hamt_plus"
import * as Rx from "rxjs"

import { become } from "~/packages/anvl/src/function"

import type { Store } from "./store"
import { IMPLICIT } from "./store"

export type StoreToken<_> = {
  key: string
}
export interface AtomToken<T> extends StoreToken<T> {
  type: `atom`
}
export interface SelectorToken<T> extends StoreToken<T> {
  type: `selector`
}
export type StateToken<T> = AtomToken<T> | SelectorToken<T>

export interface ReadonlyValueToken<_> extends StoreToken<_> {
  type: `readonly_selector`
}

export type Atom<T> = {
  key: string
  default: T
  subject: Rx.Subject<T>
}

export type GetSetInterface<T> = {
  get: () => T
  set: (newValue: T | ((oldValue: T) => T)) => void
}

export type Selector<T> = GetSetInterface<T> & {
  key: string
  subject: Rx.Subject<T>
}
export type ReadonlySelector<T> = Omit<Selector<T>, `set`>

export const operationComplete = (store: Store): void => {
  console.log(`   ✅`, `operation complete`)
  store.done.clear()
}

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

export const getState = <T>(
  token: ReadonlyValueToken<T> | StateToken<T>,
  store: Store = IMPLICIT.STORE
): T => {
  const state = detokenize<T>(token, store)
  return `get` in state ? getSelectorState(state) : getAtomState(state, store)
}

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
export const setState = <T>(
  state: StateToken<T>,
  value: T,
  store: Store = IMPLICIT.STORE
): void => {
  setState__INTERNAL(state, value, store)
  operationComplete(store)
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

export const atom = <T>(
  options: { key: string; default: T },
  store: Store = IMPLICIT.STORE
): AtomToken<T> => {
  const subject = new Rx.Subject<T>()
  const newAtom = { ...options, subject }
  store.atoms = HAMT.set(options.key, newAtom, store.atoms)
  const token: AtomToken<T> = { ...newAtom, type: `atom` }
  getState__INTERNAL(newAtom, store)
  setState(token, options.default)
  return token
}

export type Transactors = {
  get: <S>(state: ReadonlyValueToken<S> | StateToken<S>) => S
  set: <S>(state: StateToken<S>, newValue: S | ((oldValue: S) => S)) => void
}
export type ReadonlyTransactors = Omit<Transactors, `set`>

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
  /* eslint-disable max-lines */

  const stateInterface: GetSetInterface<T> = {
    get: getSelf,
    set: setSelf,
  }

  const mySelector = { ...options, subject, ...stateInterface }
  store.selectors = HAMT.set(options.key, mySelector, store.selectors)
  const initialValue = getSelf()
  console.log(`   ✨`, options.key, `=`, initialValue)
  return { ...mySelector, type: `selector` }
}
export const subscribe = <T>(
  token: ReadonlyValueToken<T> | StateToken<T>,
  callback: (value: T) => void,
  store: Store = IMPLICIT.STORE
): (() => void) => {
  const state = detokenize<T>(token, store)
  const subscription = state.subject.subscribe(callback)
  return () => subscription.unsubscribe()
}
