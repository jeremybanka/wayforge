import HAMT from "hamt_plus"
import * as Rx from "rxjs"

import { become } from "~/packages/anvl/src/function"
import type { Serializable } from "~/packages/anvl/src/json"
import { stringifyJson } from "~/packages/anvl/src/json"

import type { Selector, ReadonlySelector, Store } from "."
import {
  deposit,
  markDone,
  lookup,
  IMPLICIT,
  getState__INTERNAL,
  setState__INTERNAL,
  withdraw,
} from "."
import type {
  AtomToken,
  FamilyMetadata,
  ReadonlySelectorFamilyOptions,
  ReadonlySelectorOptions,
  ReadonlyValueToken,
  SelectorFamilyOptions,
  SelectorOptions,
  SelectorToken,
  StateToken,
} from ".."
import type { Transactors } from "../transaction"

export const lookupSelectorSources = (
  key: string,
  store: Store
): (
  | AtomToken<unknown>
  | ReadonlyValueToken<unknown>
  | SelectorToken<unknown>
)[] =>
  store.selectorGraph
    .getRelations(key)
    .filter(({ source }) => source !== key)
    .map(({ source }) => lookup(source, store))

export const traceSelectorAtoms = (
  selectorKey: string,
  dependency: ReadonlyValueToken<unknown> | StateToken<unknown>,
  store: Store
): AtomToken<unknown>[] => {
  const roots: AtomToken<unknown>[] = []

  const sources = lookupSelectorSources(dependency.key, store)
  let depth = 0
  while (sources.length > 0) {
    /* eslint-disable-next-line @typescript-eslint/no-non-null-assertion */
    const source = sources.shift()!
    ++depth
    if (depth > 999) {
      throw new Error(
        `Maximum selector dependency depth exceeded in selector "${selectorKey}".`
      )
    }

    if (source.type !== `atom`) {
      sources.push(...lookupSelectorSources(source.key, store))
    } else {
      roots.push(source)
    }
  }

  return roots
}

export const traceAllSelectorAtoms = (
  selectorKey: string,
  store: Store
): AtomToken<unknown>[] => {
  const sources = lookupSelectorSources(selectorKey, store)
  return sources.flatMap((source) =>
    source.type === `atom`
      ? source
      : traceSelectorAtoms(selectorKey, source, store)
  )
}

export const updateSelectorAtoms = (
  selectorKey: string,
  dependency: ReadonlyValueToken<unknown> | StateToken<unknown>,
  store: Store
): void => {
  if (dependency.type === `atom`) {
    store.selectorAtoms = store.selectorAtoms.set(selectorKey, dependency.key)
    store.config.logger?.info(
      `   || adding root for "${selectorKey}": ${dependency.key}`
    )
    return
  }
  const roots = traceSelectorAtoms(selectorKey, dependency, store)
  store.config.logger?.info(`   || adding roots for "${selectorKey}":`, roots)
  for (const root of roots) {
    store.selectorAtoms = store.selectorAtoms.set(selectorKey, root.key)
  }
}

export const registerSelector = (
  selectorKey: string,
  store: Store = IMPLICIT.STORE
): Transactors => ({
  get: (dependency) => {
    const alreadyRegistered = store.selectorGraph
      .getRelations(selectorKey)
      .some(({ source }) => source === dependency.key)

    const dependencyState = withdraw(dependency, store)
    const dependencyValue = getState__INTERNAL(dependencyState, store)

    if (alreadyRegistered) {
      store.config.logger?.info(
        `   || ${selectorKey} <- ${dependency.key} =`,
        dependencyValue
      )
    } else {
      store.config.logger?.info(
        `🔌 registerSelector "${selectorKey}" <- "${dependency.key}" =`,
        dependencyValue
      )
      store.selectorGraph = store.selectorGraph.set(
        selectorKey,
        dependency.key,
        {
          source: dependency.key,
        }
      )
    }
    updateSelectorAtoms(selectorKey, dependency, store)
    return dependencyValue
  },
  set: (stateToken, newValue) => {
    const state = withdraw(stateToken, store)
    setState__INTERNAL(state, newValue, store)
  },
})

export function selector__INTERNAL<T>(
  options: SelectorOptions<T>,
  family?: FamilyMetadata,
  store?: Store
): SelectorToken<T>
export function selector__INTERNAL<T>(
  options: ReadonlySelectorOptions<T>,
  family?: FamilyMetadata,
  store?: Store
): ReadonlyValueToken<T>
export function selector__INTERNAL<T>(
  options: ReadonlySelectorOptions<T> | SelectorOptions<T>,
  family?: FamilyMetadata,
  store: Store = IMPLICIT.STORE
): ReadonlyValueToken<T> | SelectorToken<T> {
  if (HAMT.has(options.key, store.selectors)) {
    store.config.logger?.error(
      `Key "${options.key}" already exists in the store.`
    )
  }

  const subject = new Rx.Subject<{ newValue: T; oldValue: T }>()

  const { get, set } = registerSelector(options.key, store)
  const getSelf = () => {
    const value = options.get({ get })
    store.valueMap = HAMT.set(options.key, value, store.valueMap)
    return value
  }

  if (!(`set` in options)) {
    const readonlySelector: ReadonlySelector<T> = {
      ...options,
      subject,
      get: getSelf,
      type: `readonly_selector`,
      ...(family && { family }),
    }
    store.readonlySelectors = HAMT.set(
      options.key,
      readonlySelector,
      store.readonlySelectors
    )
    const initialValue = getSelf()
    store.config.logger?.info(`   ✨ "${options.key}" =`, initialValue)
    return { ...readonlySelector, type: `readonly_selector` }
  }
  const setSelf = (next: T | ((oldValue: T) => T)): void => {
    store.config.logger?.info(`   <- "${options.key}" became`, next)
    const oldValue = getSelf()
    const newValue = become(next)(oldValue)
    store.valueMap = HAMT.set(options.key, newValue, store.valueMap)
    markDone(options.key, store)
    subject.next({ newValue, oldValue })
    options.set({ get, set }, newValue)
  }

  const mySelector: Selector<T> = {
    ...options,
    subject,
    get: getSelf,
    set: setSelf,
    type: `selector`,
    ...(family && { family }),
  }
  store.selectors = HAMT.set(options.key, mySelector, store.selectors)
  const initialValue = getSelf()
  store.config.logger?.info(`   ✨ "${options.key}" =`, initialValue)
  return { ...mySelector, type: `selector` }
}

export function selectorFamily__INTERNAL<T, K extends Serializable>(
  options: SelectorFamilyOptions<T, K>,
  store?: Store
): (key: K) => SelectorToken<T>
export function selectorFamily__INTERNAL<T, K extends Serializable>(
  options: ReadonlySelectorFamilyOptions<T, K>,
  store?: Store
): (key: K) => ReadonlyValueToken<T>
export function selectorFamily__INTERNAL<T, K extends Serializable>(
  options: ReadonlySelectorFamilyOptions<T, K> | SelectorFamilyOptions<T, K>,
  store: Store = IMPLICIT.STORE
): (key: K) => ReadonlyValueToken<T> | SelectorToken<T> {
  return (key: K): ReadonlyValueToken<T> | SelectorToken<T> => {
    const subKey = stringifyJson(key)
    const family: FamilyMetadata = { key: options.key, subKey }
    const fullKey = `${options.key}__${subKey}`
    const existing =
      store.selectors.get(fullKey) ?? store.readonlySelectors.get(fullKey)
    if (existing) {
      return deposit(existing)
    }
    const readonlySelectorOptions: ReadonlySelectorOptions<T> = {
      key: fullKey,
      get: options.get(key),
    }
    if (!(`set` in options)) {
      return selector__INTERNAL<T>(
        {
          ...readonlySelectorOptions,
        },
        family
      )
    }
    return selector__INTERNAL<T>(
      {
        ...readonlySelectorOptions,
        set: options.set(key),
      },
      family,
      store
    )
  }
}
