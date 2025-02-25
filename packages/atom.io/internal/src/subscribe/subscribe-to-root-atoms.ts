import type { Selector } from ".."
import { readOrComputeValue } from "../get-state/read-or-compute-value"
import { newest } from "../lineage"
import { traceAllSelectorAtoms } from "../selector"
import type { Store } from "../store"
import { recallState } from "./recall-state"

export const subscribeToRootAtoms = <T>(
	store: Store,
	selector: Selector<T>,
): (() => void)[] => {
	const target = newest(store)
	const dependencySubscriptions = traceAllSelectorAtoms(selector, store).map(
		(atomKey) => {
			const atom = target.atoms.get(atomKey)
			if (atom === undefined) {
				throw new Error(
					`Atom "${atomKey}", a dependency of selector "${selector.key}", not found in store "${store.config.name}".`,
				)
			}
			return atom.subject.subscribe(
				`${selector.type}:${selector.key}`,
				(atomChange) => {
					store.logger.info(
						`📢`,
						selector.type,
						selector.key,
						`root`,
						atomKey,
						`went`,
						atomChange.oldValue,
						`->`,
						atomChange.newValue,
					)
					const oldValue = recallState(target, selector)
					const newValue = readOrComputeValue(target, selector)
					store.logger.info(
						`✨`,
						selector.type,
						selector.key,
						`went`,
						oldValue,
						`->`,
						newValue,
					)
					selector.subject.next({ newValue, oldValue })
				},
			)
		},
	)
	return dependencySubscriptions
}
