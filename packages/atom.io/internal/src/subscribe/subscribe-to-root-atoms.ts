import { recallState } from "./recall-state"
import { getState__INTERNAL } from "../get-state-internal"
import type { ReadonlySelector, Selector } from "../selector"
import { traceAllSelectorAtoms } from "../selector"
import type { Store } from "../store"
import { withdraw } from "../store"

export const subscribeToRootAtoms = <T>(
	state: ReadonlySelector<T> | Selector<T>,
	store: Store,
): { unsubscribe: () => void }[] | null => {
	const dependencySubscriptions =
		`default` in state
			? null
			: traceAllSelectorAtoms(state.key, store).map((atomToken) => {
					const atom = withdraw(atomToken, store)
					if (atom === null) {
						throw new Error(
							`Atom "${atomToken.key}", a dependency of selector "${state.key}", not found in store "${store.config.name}".`,
						)
					}
					return atom.subject.subscribe((atomChange) => {
						store.config.logger?.info(
							`📢 selector "${state.key}" saw root "${atomToken.key}" go (`,
							atomChange.oldValue,
							`->`,
							atomChange.newValue,
							`)`,
						)
						const oldValue = recallState(state, store)
						const newValue = getState__INTERNAL(state, store)
						store.config.logger?.info(
							`   <- "${state.key}" went (`,
							oldValue,
							`->`,
							newValue,
							`)`,
						)
						state.subject.next({ newValue, oldValue })
					})
			  })
	return dependencySubscriptions
}
