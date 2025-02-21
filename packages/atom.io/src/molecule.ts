import type { Molecule, Store } from "atom.io/internal"
import { IMPLICIT } from "atom.io/internal"
import { stringifyJson } from "atom.io/json"

export function makeRootMoleculeInStore<S extends string>(
	key: S,
	store: Store = IMPLICIT.STORE,
): S {
	const molecule = {
		key,
		stringKey: stringifyJson(key),
		dependsOn: `any`,
	} satisfies Molecule<S>
	store.molecules.set(stringifyJson(key), molecule)
	return key
}
