import type * as AtomIO from "atom.io"
import type { Store } from "atom.io/internal"
import { findInStore } from "atom.io/internal"
import { getFamilyOfToken } from "atom.io/internal/families/get-family-of-token"
import type { Canonical } from "atom.io/json"
import { parseJson } from "atom.io/json"
import type { Socket } from "socket.io-client"

import { pullAtom } from "./pull-atom"
import { pullAtomFamilyMember } from "./pull-atom-family-member"
import { pullMutableAtom } from "./pull-mutable-atom"
import { pullMutableAtomFamilyMember } from "./pull-mutable-atom-family-member"

export function pullSelectorFamilyMember<T, K extends Canonical>(
	store: Store,
	socket: Socket,
	familyToken: AtomIO.SelectorFamilyToken<T, K>,
	key: NoInfer<K>,
): () => void {
	const token = findInStore(store, familyToken, key)
	const atomKeys = store.selectorAtoms.getRelatedKeys(token.key)
	const unsubscribes: Array<() => void> = []
	if (atomKeys) {
		for (const atomKey of atomKeys) {
			const atom = store.atoms.get(atomKey) as AtomIO.AtomToken<any, any>
			switch (atom.type) {
				case `atom`: {
					if (atom.family) {
						const { subKey: serializedSubKey } = atom.family
						const subKey = parseJson(serializedSubKey)
						const family = getFamilyOfToken(store, atom)
						unsubscribes.push(
							pullAtomFamilyMember(store, socket, family, subKey),
						)
					} else {
						unsubscribes.push(pullAtom(store, socket, atom))
					}
					break
				}
				case `mutable_atom`: {
					if (atom.family) {
						const { subKey: serializedSubKey } = atom.family
						const subKey = parseJson(serializedSubKey)
						const family = getFamilyOfToken(store, atom)
						unsubscribes.push(
							pullMutableAtomFamilyMember(store, socket, family, subKey),
						)
					} else {
						unsubscribes.push(pullMutableAtom(store, socket, atom))
					}
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
