import type * as AtomIO from "atom.io"
import type { Store } from "atom.io/internal"
import type { Socket } from "socket.io-client"

import { pullAtom } from "./pull-atom"
import { pullMutableAtom } from "./pull-mutable-atom"

export function pullSelector<T>(
	store: Store,
	socket: Socket,
	token: AtomIO.SelectorToken<T>,
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
					unsubscribes.push(pullAtom(store, socket, atom))
					break
				}
				case `mutable_atom`: {
					unsubscribes.push(pullMutableAtom(store, socket, atom))
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
