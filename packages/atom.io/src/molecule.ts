import type { Store } from "atom.io/internal"
import { IMPLICIT, Molecule } from "atom.io/internal"
import type { Canonical } from "atom.io/json"
import { stringifyJson } from "atom.io/json"

export type MoleculeToken<K extends Canonical> = {
	key: K
	type: `molecule`
}

export function makeRootMoleculeInStore<K extends Canonical>(
	key: K,
	store: Store = IMPLICIT.STORE,
): MoleculeToken<K> {
	const molecule = new Molecule(store, undefined, key, `any`)
	store.molecules.set(stringifyJson(key), molecule)
	return {
		key,
		type: `molecule`,
	} as const
}
