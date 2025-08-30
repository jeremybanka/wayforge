import { readOrComputeValue } from "../get-state/read-or-compute-value"
import type { Atom, Selector } from "../state-types"
import type { Store } from "../store"
import { recallState } from "./recall-state"

export const subscribeToRootDependency = (
	target: Store,
	selector: Selector<any, any>,
	atom: Atom<any, any>,
): (() => void) => {
	return atom.subject.subscribe(
		`${selector.type}:${selector.key}`,
		(atomChange) => {
			target.logger.info(
				`📢`,
				selector.type,
				selector.key,
				`root`,
				atom.key,
				`went`,
				atomChange.oldValue,
				`->`,
				atomChange.newValue,
			)
			const oldValue = recallState(target, selector)
			const newValue = readOrComputeValue(target, selector)
			target.logger.info(
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
}
