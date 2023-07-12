import { updateSelectorAtoms } from "./update-selector-atoms"
import type { Transactors } from "../../transaction"
import { getState__INTERNAL, withdraw } from "../get"
import { setState__INTERNAL } from "../set"
import type { Store } from "../store"
import { IMPLICIT } from "../store"
import { target } from "../transaction-internal"

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
