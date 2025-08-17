import type { Atom, Store } from ".."
import { isAtomKey } from "../keys"
import { getSelectorDependencyKeys } from "./get-selector-dependency-keys"

export function traceRootSelectorAtoms(
	store: Store,
	selectorKey: string,
	covered: Set<string> = new Set<string>(),
): Map<string, Atom<unknown>> {
	const dependencies = getSelectorDependencyKeys(store, selectorKey)

	const roots = new Map<string, Atom<unknown>>()

	while (dependencies.length > 0) {
		// biome-ignore lint/style/noNonNullAssertion: just checked length ^^^
		const dependencyKey = dependencies.pop()!
		if (covered.has(dependencyKey)) {
			continue
		}
		covered.add(dependencyKey)
		if (isAtomKey(store, dependencyKey)) {
			const atom = store.atoms.get(dependencyKey) as Atom<unknown>
			roots.set(atom.key, atom)
		} else {
			dependencies.push(...getSelectorDependencyKeys(store, dependencyKey))
		}
	}
	return roots
}
