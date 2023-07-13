import { traceSelectorAtoms } from "./trace-selector-atoms"
import type { Store } from ".."
import { target } from ".."
import type { ReadonlySelectorToken, StateToken } from "../.."

export const updateSelectorAtoms = (
	selectorKey: string,
	dependency: ReadonlySelectorToken<unknown> | StateToken<unknown>,
	store: Store,
): void => {
	const core = target(store)
	if (dependency.type === `atom`) {
		core.selectorAtoms = core.selectorAtoms.set({
			selectorKey,
			atomKey: dependency.key,
		})
		store.config.logger?.info(
			`   || adding root for "${selectorKey}": ${dependency.key}`,
		)
		return
	}
	const roots = traceSelectorAtoms(selectorKey, dependency, store)
	store.config.logger?.info(
		`   || adding roots for "${selectorKey}":`,
		roots.map((r) => r.key),
	)
	for (const root of roots) {
		core.selectorAtoms = core.selectorAtoms.set({
			selectorKey,
			atomKey: root.key,
		})
	}
}
