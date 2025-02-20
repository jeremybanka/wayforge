import type { Molecule, Store } from "atom.io/internal"
import { IMPLICIT } from "atom.io/internal"
import type { Canonical } from "atom.io/json"
import { stringifyJson } from "atom.io/json"

export type MoleculeToken<K extends Canonical> = {
	key: K
	type: `molecule`
}

export function makeRootMoleculeInStore<S extends string>(
	key: S,
	store: Store = IMPLICIT.STORE,
): MoleculeToken<S> {
	const molecule = {
		key,
		stringKey: stringifyJson(key),
		dependsOn: `any`,
	} satisfies Molecule<S>
	store.molecules.set(stringifyJson(key), molecule)
	return {
		key,
		type: `molecule`,
	} as const
}
