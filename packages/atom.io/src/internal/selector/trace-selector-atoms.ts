import { isAtomKey } from "../keys"
import type { Atom } from "../state-types"
import type { Store } from "../store"
import { getSelectorDependencyKeys } from "./get-selector-dependency-keys"

export function traceRootSelectorAtoms(
	store: Store,
	selectorKey: string,
	covered: Set<string> = new Set<string>(),
): Map<string, Atom<any, any>> {
	const dependencies = getSelectorDependencyKeys(store, selectorKey)

	const roots = new Map<string, Atom<unknown, unknown>>()

	while (dependencies.length > 0) {
		// biome-ignore lint/style/noNonNullAssertion: just checked length ^^^
		const dependencyKey = dependencies.pop()!
		if (covered.has(dependencyKey)) {
			continue
		}
		covered.add(dependencyKey)
		if (isAtomKey(store, dependencyKey)) {
			const atom = store.atoms.get(dependencyKey) as Atom<unknown, unknown>
			roots.set(atom.key, atom)
		} else {
			dependencies.push(...getSelectorDependencyKeys(store, dependencyKey))
		}
	}
	return roots
}
