import type * as AtomIO from "atom.io"
import type { Store } from "atom.io/internal"
import type { Socket } from "socket.io-client"

import { pullAtomFamilyMember } from "./pull-atom-family-member"
import { pullMutableAtomFamilyMember } from "./pull-mutable-atom-family-member"

/* eslint-disable no-console */

export function pullSelectorFamilyMember<T>(
	store: Store,
	socket: Socket,
	token: AtomIO.SelectorToken<T>,
): () => void {
	if (!(`family` in token)) {
		console.error(`Token is not a family member:`, token)
		return () => {}
	}
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
					unsubscribes.push(pullAtomFamilyMember(store, socket, atom))
					break
				}
				case `mutable_atom`: {
					unsubscribes.push(pullMutableAtomFamilyMember(store, socket, atom))
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
