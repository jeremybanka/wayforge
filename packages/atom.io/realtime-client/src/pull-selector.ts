import type * as AtomIO from "atom.io"
import type { Store } from "atom.io/internal"
import type { Socket } from "socket.io-client"

import { pullAtom } from "./pull-atom"
import { pullMutableAtom } from "./pull-mutable-atom"

export function pullSelector<T>(
	token: AtomIO.SelectorToken<T>,
	socket: Socket,
	store: Store,
): () => void {
	const atomKeys = store.selectorAtoms.getRelatedKeys(token.key)
	const unsubscribes: Array<() => void> = []
	if (atomKeys) {
		for (const atomKey of atomKeys) {
			const atom = store.atoms.get(atomKey)
			if (!atom) {
				continue
			}
			switch (atom.type) {
				case `atom`: {
					unsubscribes.push(pullAtom(atom, socket, store))
					break
				}
				case `mutable_atom`: {
					unsubscribes.push(pullMutableAtom(atom, socket, store))
					break
				}
			}
		}
	}
	return () => {
		for (const unsubscribe of unsubscribes) {
			unsubscribe()
		}
	}
}
