import type * as AtomIO from "atom.io"
import {
	IMPLICIT,
	findInStore,
	getFromStore,
	subscribeToState,
} from "atom.io/internal"
import { type Json, stringifyJson } from "atom.io/json"

import type { ServerConfig } from "."

export type FamilyProvider = ReturnType<typeof realtimeAtomFamilyProvider>
export function realtimeAtomFamilyProvider({
	socket,
	store = IMPLICIT.STORE,
}: ServerConfig) {
	return function familyProvider<
		J extends Json.Serializable,
		K extends Json.Serializable,
	>(
		family: AtomIO.RegularAtomFamilyToken<J, K>,
		index: AtomIO.ReadableToken<Iterable<K>>,
	): () => void {
		const unsubSingleCallbacksByKey = new Map<string, () => void>()
		const unsubFamilyCallbacksByKey = new Map<string, () => void>()

		const fillSingleUnsubRequest = (key: string) => {
			socket.off(`unsub:${key}`, fillSingleUnsubRequest)
			const unsub = unsubSingleCallbacksByKey.get(key)
			if (unsub) {
				unsub()
				unsubSingleCallbacksByKey.delete(key)
			}
		}

		const fillSubRequest = (subKey: K) => {
			const exposedSubKeys = getFromStore(index, store)
			for (const exposedSubKey of exposedSubKeys) {
				if (stringifyJson(exposedSubKey) === stringifyJson(subKey)) {
					const token = findInStore(family, subKey, store)
					socket.emit(`serve:${token.key}`, getFromStore(token, store))
					const unsubscribe = subscribeToState(
						token,
						({ newValue }) => {
							socket.emit(`serve:${token.key}`, newValue)
						},
						`expose-family:${family.key}:${socket.id}`,
						store,
					)
					unsubSingleCallbacksByKey.set(token.key, unsubscribe)
					socket.on(`unsub:${token.key}`, () => {
						fillSingleUnsubRequest(token.key)
					})
					break
				}
			}
		}

		socket.on(`sub:${family.key}`, fillSubRequest)

		return () => {
			socket.off(`sub:${family.key}`, fillSubRequest)
			for (const [, unsub] of unsubFamilyCallbacksByKey) {
				unsub()
			}
			for (const [, unsub] of unsubSingleCallbacksByKey) {
				unsub()
			}
			unsubFamilyCallbacksByKey.clear()
			unsubSingleCallbacksByKey.clear()
		}
	}
}
