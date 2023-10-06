import { getState__INTERNAL } from "../get-state-internal"
import type { ReadonlySelector, Selector } from "../selector"
import { traceAllSelectorAtoms } from "../selector"
import type { Store } from "../store"
import { withdraw } from "../store"
import { recallState } from "./recall-state"

export const subscribeToRootAtoms = <T>(
	state: ReadonlySelector<T> | Selector<T>,
	store: Store,
): (() => void)[] | null => {
	const dependencySubscriptions =
		`default` in state
			? null
			: traceAllSelectorAtoms(state.key, store).map((atomToken) => {
					const atom = withdraw(atomToken, store)
					if (atom === undefined) {
						throw new Error(
							`Atom "${atomToken.key}", a dependency of selector "${state.key}", not found in store "${store.config.name}".`,
						)
					}
					return atom.subject.subscribe(
						`${state.type}:${state.key}`,
						(atomChange) => {
							store.config.logger?.info(
								`📢 selector "${state.key}" saw root "${atomToken.key}" go (`,
								atomChange.oldValue,
								`->`,
								atomChange.newValue,
								`)`,
							)
							const oldValue = recallState(state, store)
							// ❗ this retrieves a stale cached value when applying a transaction on the server
							const newValue = getState__INTERNAL(state, store)
							store.config.logger?.info(
								`   <- "${state.key}" went (`,
								oldValue,
								`->`,
								newValue,
								`)`,
							)
							state.subject.next({ newValue, oldValue })
						},
					)
			  })
	return dependencySubscriptions
}
