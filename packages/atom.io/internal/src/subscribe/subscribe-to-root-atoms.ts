import { getState__INTERNAL } from "../get-state-internal"
import type { ReadonlySelector, Selector } from "../selector"
import { traceAllSelectorAtoms } from "../selector"
import type { Store } from "../store"
import { recallState } from "./recall-state"

export const subscribeToRootAtoms = <T>(
	state: ReadonlySelector<T> | Selector<T>,
	store: Store,
): (() => void)[] | null => {
	const dependencySubscriptions =
		`default` in state
			? null
			: traceAllSelectorAtoms(state.key, store).map((atomKey) => {
					const atom = store.atoms.get(atomKey)
					if (atom === undefined) {
						throw new Error(
							`Atom "${atomKey}", a dependency of selector "${state.key}", not found in store "${store.config.name}".`,
						)
					}
					return atom.subject.subscribe(
						`${state.type}:${state.key}`,
						(atomChange) => {
							store.logger.info(
								`📢 selector "${state.key}" saw root "${atomKey}" go (`,
								atomChange.oldValue,
								`->`,
								atomChange.newValue,
								`)`,
							)
							const oldValue = recallState(state, store)
							// ❗ this retrieves a stale cached value when applying a transaction on the server
							const newValue = getState__INTERNAL(state, store)
							store.logger.info(
								`✨ "${state.key}" went (`,
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
