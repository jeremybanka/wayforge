import type * as AtomIO from "atom.io"
import { type Store, subscribeInStore } from "atom.io/internal"
import type { Socket } from "socket.io-client"

import { pullAtom } from "./pull-atom"
import { pullMutableAtom } from "./pull-mutable-atom"

export function pullSelector<T>(
	token: AtomIO.SelectorToken<T>,
	socket: Socket,
	store: Store,
): () => void {
	const atomUnsubFns = new Set<() => void>()
	const unsubSelector = subscribeInStore(
		store,
		token,
		reloadSubscriptions,
		`pull-selector`,
	)

	function loadSubscriptions(): void {
		const atomKeys = store.selectorAtoms.getRelatedKeys(token.key)
		console.log(`🔍🔍🔍🔍🔍🔍🔍🔍🔍 --> `, atomKeys)
		if (atomKeys) {
			for (const atomKey of atomKeys) {
				const atom = store.atoms.get(atomKey)
				if (!atom) {
					continue
				}
				switch (atom.type) {
					case `atom`: {
						atomUnsubFns.add(pullAtom(atom, socket, store))
						break
					}
					case `mutable_atom`: {
						atomUnsubFns.add(pullMutableAtom(atom, socket, store))
						break
					}
				}
			}
		}
	}

	function unloadSubscriptions(): void {
		unsubSelector()
		for (const unsub of atomUnsubFns) {
			unsub()
		}
	}

	function reloadSubscriptions(update: AtomIO.StateUpdate<T>): void {
		console.log(
			`🔍🔍🔍🔍🔍🔍🔍🔍🔍`,
			store.config.name,
			`pull reloading subscriptions for selector`,
			token.key,
			update,
		)
		unloadSubscriptions()
		atomUnsubFns.clear()
		loadSubscriptions()
	}

	loadSubscriptions()

	return unloadSubscriptions
}
