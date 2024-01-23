import type * as AtomIO from "atom.io"
import type { Store } from "atom.io/internal"
import type { Socket } from "socket.io-client"

import { pullFamilyMember } from "./pull-family-member"
import { pullMutableFamilyMember } from "./pull-mutable-family-member"

export function pullSelectorFamilyMember<T>(
	token: AtomIO.SelectorToken<T>,
	socket: Socket,
	store: Store,
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
					unsubscribes.push(pullFamilyMember(atom, socket, store))
					break
				}
				case `mutable_atom`: {
					unsubscribes.push(pullMutableFamilyMember(atom, socket, store))
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
