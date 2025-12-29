import type { AtomToken, SelectorToken } from "atom.io"
import type { Store } from "atom.io/internal"
import { getFamilyOfToken, subscribeToState } from "atom.io/internal"
import { parseJson } from "atom.io/json"
import type { Socket } from "atom.io/realtime"

import { pullAtom } from "./pull-atom"
import { pullAtomFamilyMember } from "./pull-atom-family-member"
import { pullMutableAtom } from "./pull-mutable-atom"
import { pullMutableAtomFamilyMember } from "./pull-mutable-atom-family-member"

export function pullSelectorRoots(
	store: Store,
	socket: Socket,
	selectorToken: SelectorToken<any>,
): () => void {
	const atomSubscriptions = new Map<string, () => void>()

	const start = () => {
		const atomKeys = store.selectorAtoms.getRelatedKeys(selectorToken.key)
		if (atomKeys) {
			for (const [atomKey, unsub] of atomSubscriptions) {
				if (!atomKeys.has(atomKey)) {
					unsub()
					atomSubscriptions.delete(atomKey)
				}
			}

			for (const atomKey of atomKeys) {
				if (atomSubscriptions.has(atomKey)) {
					continue
				}
				const atom = store.atoms.get(atomKey) as AtomToken<any, any>
				switch (atom.type) {
					case `atom`: {
						if (atom.family) {
							const { subKey: serializedSubKey } = atom.family
							const subKey = parseJson(serializedSubKey)
							const family = getFamilyOfToken(store, atom)
							atomSubscriptions.set(
								atomKey,
								pullAtomFamilyMember(store, socket, family, subKey),
							)
						} else {
							atomSubscriptions.set(atomKey, pullAtom(store, socket, atom))
						}
						break
					}
					case `mutable_atom`: {
						if (atom.family) {
							const { subKey: serializedSubKey } = atom.family
							const subKey = parseJson(serializedSubKey)
							const family = getFamilyOfToken(store, atom)
							atomSubscriptions.set(
								atomKey,
								pullMutableAtomFamilyMember(store, socket, family, subKey),
							)
						} else {
							atomSubscriptions.set(
								atomKey,
								pullMutableAtom(store, socket, atom),
							)
						}
						break
					}
				}
			}
		}
	}

	const unsubFromSelector = subscribeToState(
		store,
		selectorToken,
		`pull-watches-dependencies`,
		() => {
			start()
		},
	)

	start()

	return () => {
		for (const [, unsub] of atomSubscriptions) unsub()
		atomSubscriptions.clear()
		unsubFromSelector()
	}
}
