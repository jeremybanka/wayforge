import { newest } from "../lineage"
import { readOrComputeValue } from "../read-or-compute-value"
import type { ReadonlySelector, WritableSelector } from "../selector"
import { traceAllSelectorAtoms } from "../selector"
import type { Store } from "../store"
import { recallState } from "./recall-state"

export const subscribeToRootAtoms = <T>(
	state: ReadonlySelector<T> | WritableSelector<T>,
	store: Store,
): (() => void)[] | null => {
	const target = newest(store)
	const dependencySubscriptions =
		`default` in state
			? null
			: traceAllSelectorAtoms(state.key, store).map((atomKey) => {
					const atom = target.atoms.get(atomKey)
					if (atom === undefined) {
						throw new Error(
							`Atom "${atomKey}", a dependency of selector "${state.key}", not found in store "${store.config.name}".`,
						)
					}
					return atom.subject.subscribe(
						`${state.type}:${state.key}`,
						(atomChange) => {
							store.logger.info(
								`📢`,
								state.type,
								state.key,
								`root`,
								atomKey,
								`went`,
								atomChange.oldValue,
								`->`,
								atomChange.newValue,
							)
							const oldValue = recallState(state, target)
							// ❌ this retrieves a stale cached value when applying a transaction on the server
							const newValue = readOrComputeValue(state, target)
							store.logger.info(
								`✨`,
								state.type,
								state.key,
								`went`,
								oldValue,
								`->`,
								newValue,
							)
							state.subject.next({ newValue, oldValue })
						},
					)
			  })
	return dependencySubscriptions
}
