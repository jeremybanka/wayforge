import type { Hamt } from "hamt_plus"
import HAMT from "hamt_plus"
import * as Rx from "rxjs"

import { become } from "~/packages/anvl/src/function"
import { Join } from "~/packages/anvl/src/join"

type Atom<T> = {
  key: string
  default: T
  subject: Rx.Subject<T>
}

export type GetSetInterface<T> = {
  get: () => T
  set: (newValue: T | ((oldValue: T) => T)) => void
}

type Selector<T> = GetSetInterface<T> & {
  key: string
  subject: Rx.Subject<T>
}
type ReadonlySelector<T> = Omit<Selector<T>, `set`>

export type Store = {
  valueMap: Hamt<any, string>
  selectorGraph: Join
  selectors: Hamt<Selector<any>, string>
  readonlySelectors: Hamt<ReadonlySelector<any>, string>
  atoms: Hamt<Atom<any>, string>
  done: Set<string>
}

export const createStore = (): Store =>
  ({
    valueMap: HAMT.make<any, string>(),
    selectorGraph: new Join({ relationType: `n:n` }),
    atoms: HAMT.make<Atom<any>, string>(),
    selectors: HAMT.make<Selector<any>, string>(),
    readonlySelectors: HAMT.make<ReadonlySelector<any>, string>(),
    done: new Set(),
  } satisfies Store)

export const IMPLICIT = {
  STORE_INTERNAL: undefined as Store | undefined,
  get STORE(): Store {
    return this.STORE_INTERNAL ?? (this.STORE_INTERNAL = createStore())
  },
  set STORE(value: Store) {
    this.STORE_INTERNAL = value
  },
}

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

export const getState = <T>(
  state: Atom<T> | ReadonlySelector<T> | Selector<T>,
  store: Store = IMPLICIT.STORE
): T => (`get` in state ? getSelectorState(state) : getAtomState(state, store))

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
    const newValue = getState(state, store)
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
  state: Atom<T> | Selector<T>,
  value: T,
  store: Store = IMPLICIT.STORE
): void => {
  if (`set` in state) {
    setSelectorState(state, value, store)
  } else {
    setAtomState(state, value, store)
  }
}
export const setState = <T>(
  state: Atom<T> | Selector<T>,
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
  getState: <T>(state: Atom<T> | ReadonlySelector<T> | Selector<T>) => T
  setState: <T>(state: Atom<T> | Selector<T>, value: T) => void
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
  setState: (state, newValue) => {
    store.selectorGraph.set(state.key, selectorKey)
    setState__INTERNAL(state, newValue, store)
  },
})

export const atom = <T>(
  options: { key: string; default: T },
  store: Store = IMPLICIT.STORE
): Atom<T> => {
  const subject = new Rx.Subject<T>()
  const newAtom = { ...options, subject }
  store.atoms = HAMT.set(options.key, newAtom, store.atoms)
  getState(newAtom, store)
  setState(newAtom, options.default)
  return newAtom
}

export type Transactors = {
  get: <S>(state: Atom<S> | ReadonlySelector<S> | Selector<S>) => S
  set: <S>(
    state: Atom<S> | Selector<S>,
    newValue: S | ((oldValue: S) => S)
  ) => void
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
): Selector<T>
export function selector<T>(
  options: ReadonlySelectorOptions<T>,
  store?: Store
): ReadonlySelector<T>
export function selector<T>(
  options: ReadonlySelectorOptions<T> | SelectorOptions<T>,
  store: Store = IMPLICIT.STORE
): ReadonlySelector<T> | Selector<T> {
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
    return readonlySelector
  }

  const setSelf = (next: T | ((oldValue: T) => T)): void => {
    console.log(`${options.key}.set`, next)
    const newValue = become(next)(getSelf)
    store.done.add(options.key)
    subject.next(newValue)
    options.set(newValue, { get, set })
  }

  const stateInterface: GetSetInterface<T> = {
    get: getSelf,
    set: setSelf,
  }

  const mySelector = { ...options, subject, ...stateInterface }
  store.selectors = HAMT.set(options.key, mySelector, store.selectors)
  const initialValue = getSelf()
  console.log(`   ✨`, options.key, `=`, initialValue)
  return mySelector
}

export const subscribe = <T>(
  item: Atom<T> | ReadonlySelector<T> | Selector<T>,
  callback: (value: T) => void
): (() => void) => {
  const subscription = item.subject.subscribe(callback)
  return () => subscription.unsubscribe()
}
