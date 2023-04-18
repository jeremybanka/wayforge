import type { Atom, ReadonlySelector, Selector } from "."
import { getState__INTERNAL, withdraw } from "./get"
import { recallState } from "./operation"
import { traceAllSelectorAtoms } from "./selector-internal"
import type { Store } from "./store"
import { IMPLICIT } from "./store"
import { __INTERNAL__ } from ".."

export const subscribeToRootAtoms = <T>(
  state: ReadonlySelector<T> | Selector<T>,
  store: Store = IMPLICIT.STORE
): { unsubscribe: () => void }[] | null => {
  const dependencySubscriptions =
    `default` in state
      ? null
      : traceAllSelectorAtoms(state.key, store).map((atomToken) => {
          const atom = withdraw(atomToken, store)
          return atom.subject.subscribe((atomChange) => {
            store.config.logger?.info(
              `📢 selector ${state.key} saw its root atom "${atomToken.key}" change (`,
              atomChange.oldValue,
              `->`,
              atomChange.newValue,
              `)`
            )
            const oldValue = recallState(state, store)
            const newValue = getState__INTERNAL(state, store)
            store.config.logger?.info(`   <- ${state.key} became`, newValue)
            state.subject.next({ newValue, oldValue })
          })
        })
  return dependencySubscriptions
}
