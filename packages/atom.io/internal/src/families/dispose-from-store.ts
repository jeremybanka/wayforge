import type { MoleculeToken, ReadableToken } from "atom.io"

import { disposeAtom } from "../atom"
import { disposeMolecule } from "../molecule/dispose-molecule"
import { disposeSelector } from "../selector"
import type { Store } from "../store"
import { IMPLICIT } from "../store"

export function disposeFromStore(
	token: MoleculeToken<any> | ReadableToken<any>,
	store: Store = IMPLICIT.STORE,
): void {
	switch (token.type) {
		case `atom`:
		case `mutable_atom`:
			disposeAtom(token, store)
			break
		case `selector`:
		case `readonly_selector`:
			disposeSelector(token, store)
			break
		case `molecule`:
			disposeMolecule(token, store)
			break
	}
}
