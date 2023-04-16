import type { Store } from "."
import {
  lookup,
  IMPLICIT,
  getState__INTERNAL,
  setState__INTERNAL,
  withdraw,
} from "."
import type {
  AtomToken,
  ReadonlyValueToken,
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
