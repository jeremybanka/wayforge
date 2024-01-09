import type { Selector } from ".."
import { newest } from "../lineage"
import { readOrComputeValue } from "../read-or-compute-value"
import { traceAllSelectorAtoms } from "../selector"
import type { Store } from "../store"
import { recallState } from "./recall-state"

export const subscribeToRootAtoms = <T>(
	selector: Selector<T>,
	store: Store,
): (() => void)[] | null => {
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
					const oldValue = recallState(selector, target)
					const newValue = readOrComputeValue(selector, target)
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
