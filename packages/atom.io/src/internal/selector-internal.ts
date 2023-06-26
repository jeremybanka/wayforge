import HAMT from "hamt_plus"
import * as Rx from "rxjs"

import { become } from "~/packages/anvl/src/function"

import type { Store } from "."
import {
  target,
  cacheValue,
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
  ReadonlySelectorOptions,
  ReadonlySelectorToken,
  SelectorOptions,
  SelectorToken,
  StateToken,
} from ".."
import type { Transactors } from "../transaction"

export type Selector<T> = {
  key: string
  type: `selector`
  family?: FamilyMetadata
  subject: Rx.Subject<{ newValue: T; oldValue: T }>
  get: () => T
  set: (newValue: T | ((oldValue: T) => T)) => void
}
export type ReadonlySelector<T> = {
  key: string
  type: `readonly_selector`
  family?: FamilyMetadata
  subject: Rx.Subject<{ newValue: T; oldValue: T }>
  get: () => T
}

export const lookupSelectorSources = (
  key: string,
  store: Store
): (
  | AtomToken<unknown>
  | ReadonlySelectorToken<unknown>
  | SelectorToken<unknown>
)[] =>
  target(store)
    .selectorGraph.getRelations(key)
    .filter(({ source }) => source !== key)
    .map(({ source }) => lookup(source, store))

export const traceSelectorAtoms = (
  selectorKey: string,
  dependency: ReadonlySelectorToken<unknown> | StateToken<unknown>,
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
  dependency: ReadonlySelectorToken<unknown> | StateToken<unknown>,
  store: Store
): void => {
  const core = target(store)
  if (dependency.type === `atom`) {
    core.selectorAtoms = core.selectorAtoms.set({
      selectorKey,
      atomKey: dependency.key,
    })
    store.config.logger?.info(
      `   || adding root for "${selectorKey}": ${dependency.key}`
    )
    return
  }
  const roots = traceSelectorAtoms(selectorKey, dependency, store)
  store.config.logger?.info(
    `   || adding roots for "${selectorKey}":`,
    roots.map((r) => r.key)
  )
  for (const root of roots) {
    core.selectorAtoms = core.selectorAtoms.set({
      selectorKey,
      atomKey: root.key,
    })
  }
}

export const registerSelector = (
  selectorKey: string,
  store: Store = IMPLICIT.STORE
): Transactors => ({
  get: (dependency) => {
    const core = target(store)
    const alreadyRegistered = core.selectorGraph
      .getRelations(selectorKey)
      .some(({ source }) => source === dependency.key)

    const dependencyState = withdraw(dependency, store)
    if (dependencyState === null) {
      throw new Error(
        `State "${dependency.key}" not found in this store. Did you forget to initialize with the "atom" or "selector" function?`
      )
    }
    const dependencyValue = getState__INTERNAL(dependencyState, store)

    if (alreadyRegistered) {
      store.config.logger?.info(
        `   || ${selectorKey} <- ${dependency.key} =`,
        dependencyValue
      )
    } else {
      store.config.logger?.info(
        `🔌 registerSelector "${selectorKey}" <- ( "${dependency.key}" =`,
        dependencyValue,
        `)`
      )
      core.selectorGraph = core.selectorGraph.set(
        { from: dependency.key, to: selectorKey },
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
    if (state === null) {
      throw new Error(
        `State "${stateToken.key}" not found in this store. Did you forget to initialize with the "atom" or "selector" function?`
      )
    }
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
): ReadonlySelectorToken<T>
export function selector__INTERNAL<T>(
  options: ReadonlySelectorOptions<T> | SelectorOptions<T>,
  family?: FamilyMetadata,
  store: Store = IMPLICIT.STORE
): ReadonlySelectorToken<T> | SelectorToken<T> {
  const core = target(store)
  if (HAMT.has(options.key, core.selectors)) {
    store.config.logger?.error(
      `Key "${options.key}" already exists in the store.`
    )
  }

  const subject = new Rx.Subject<{ newValue: T; oldValue: T }>()

  const { get, set } = registerSelector(options.key, store)
  const getSelf = () => {
    const value = options.get({ get })
    cacheValue(options.key, value, store)
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
    core.readonlySelectors = HAMT.set(
      options.key,
      readonlySelector,
      core.readonlySelectors
    )
    const initialValue = getSelf()
    store.config.logger?.info(`   ✨ "${options.key}" =`, initialValue)
    const token: ReadonlySelectorToken<T> = {
      key: options.key,
      type: `readonly_selector`,
      family,
    }
    store.subject.selectorCreation.next(token)
    return token
  }
  const setSelf = (next: T | ((oldValue: T) => T)): void => {
    store.config.logger?.info(`   <- "${options.key}" became`, next)
    const oldValue = getSelf()
    const newValue = become(next)(oldValue)
    cacheValue(options.key, newValue, store)
    markDone(options.key, store)
    if (store.transactionStatus.phase === `idle`) {
      subject.next({ newValue, oldValue })
    }
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
  core.selectors = HAMT.set(options.key, mySelector, core.selectors)
  const initialValue = getSelf()
  store.config.logger?.info(`   ✨ "${options.key}" =`, initialValue)
  const token: SelectorToken<T> = {
    key: options.key,
    type: `selector`,
    family,
  }
  store.subject.selectorCreation.next(token)
  return token
}
