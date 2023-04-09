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
}

export const createStore = (): Store =>
  ({
    valueMap: HAMT.make<any, string>(),
    selectorGraph: new Join({ relationType: `n:n` }),
    atoms: HAMT.make<Atom<any>, string>(),
    selectors: HAMT.make<Selector<any>, string>(),
    readonlySelectors: HAMT.make<ReadonlySelector<any>, string>(),
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

export const getAtomState = <T>(
  atom: Atom<T>,
  store: Store = IMPLICIT.STORE
): T => HAMT.get(atom.key, store.valueMap)

export const getSelectorState = <T>(selector: Selector<T>): T => selector.get()

export const getState = <T>(
  state: Atom<T> | Selector<T>,
  store: Store = IMPLICIT.STORE
): T => (`get` in state ? getSelectorState(state) : getAtomState(state, store))

export const setDownstreamState = <T>(
  atom: Atom<T>,
  store: Store = IMPLICIT.STORE
): void => {
  const selectorKeys = store.selectorGraph.getRelations(atom.key)
  selectorKeys.forEach(({ id: selectorKey }) => {
    console.log(`->`, `bumping`, selectorKey)
    const selector = HAMT.get(selectorKey, store.selectors)
    const newValue = getState(selector, store)
    console.log(`   <-`, selectorKey, `became`, newValue)
    selector.subject.next(newValue)
  })
}

export const setAtomState = <T>(
  atom: Atom<T>,
  value: T,
  store: Store = IMPLICIT.STORE
): void => {
  store.valueMap = HAMT.set(atom.key, value, store.valueMap)
  atom.subject.next(value)
  setDownstreamState(atom, store)
}

export const registerSelector = (
  selectorKey: string,
  store: Store = IMPLICIT.STORE
): {
  getState: <T>(atom: Atom<T>) => T
  setState: <T>(atom: Atom<T>, newValue: T | ((oldValue: T) => T)) => void
} => ({
  getState: (atom) => {
    const isRegistered = store.selectorGraph
      .getRelatedIds(selectorKey)
      .includes(atom.key)
    if (isRegistered) {
      console.log(`   ||`, selectorKey, `<-`, atom.key)
    } else {
      console.log(`🔌 registerSelector`, atom.key, `->`, selectorKey)
      store.selectorGraph = store.selectorGraph.set(selectorKey, atom.key)
    }

    const currentAtomValue = getState(atom, store)
    console.log(`   ||`, `currentAtomValue`, currentAtomValue)
    return currentAtomValue
  },
  setState: (atom, newValue) => {
    store.selectorGraph.set(atom.key, selectorKey)
    setAtomState(atom, newValue, store)
  },
})

export const atom = <T>(options: { key: string; default: T }): Atom<T> => {
  const subject = new Rx.Subject<T>()
  const newAtom = { ...options, subject }
  setAtomState(newAtom, options.default)

  return newAtom
}

export type Transactors = {
  get: <S>(state: Atom<S>) => S
  set: <S>(state: Atom<S>, newValue: S | ((oldValue: S) => S)) => void
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

  const { getState } = registerSelector(options.key, store)
  const getSelf = () => options.get({ get: getState })

  if (!(`set` in options)) {
    const readonlySelector = {
      ...options,
      subject,
      get: getSelf,
    }
    store.valueMap = HAMT.set(
      options.key,
      readonlySelector,
      store.readonlySelectors
    )
    return readonlySelector
  }

  const { setState } = registerSelector(options.key, store)

  const stateInterface: GetSetInterface<T> = {
    get: (): T => options.get({ get: getState }),
    set: (next: T | ((oldValue: T) => T)): void => {
      console.log(`set`, options.key, next)
      const newValue = become(next)(getSelf)
      console.log(`newValue =>`, newValue)
      options.set(newValue, { get: getState, set: setState })
      subject.next(newValue)
    },
  }

  const mySelector = { ...options, subject, ...stateInterface }
  store.selectors = HAMT.set(options.key, mySelector, store.selectors)
  return mySelector
}

export const subscribe = <T>(
  item: Atom<T> | ReadonlySelector<T> | Selector<T>,
  callback: (value: T) => void
): (() => void) => {
  const subscription = item.subject.subscribe(callback)
  return () => subscription.unsubscribe()
}
