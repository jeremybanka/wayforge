import type * as AtomIO from "atom.io"
import {
	findInStore,
	getFromStore,
	IMPLICIT,
	subscribeToState,
} from "atom.io/internal"
import type { Canonical, Json } from "atom.io/json"
import { stringifyJson } from "atom.io/json"

import type { ServerConfig } from "."

export type FamilyProvider = ReturnType<typeof realtimeAtomFamilyProvider>
export function realtimeAtomFamilyProvider({
	socket,
	store = IMPLICIT.STORE,
}: ServerConfig) {
	return function familyProvider<
		J extends Json.Serializable,
		K extends Canonical,
	>(
		family: AtomIO.RegularAtomFamilyToken<J, K>,
		index: AtomIO.ReadableToken<Iterable<K>>,
	): () => void {
		const unsubCallbacksByKey = new Map<string, () => void>()

		const fillUnsubRequest = (key: string) => {
			socket.off(`unsub:${key}`, fillUnsubRequest)
			const unsub = unsubCallbacksByKey.get(key)
			if (unsub) {
				unsub()
				unsubCallbacksByKey.delete(key)
			}
		}

		const fillSubRequest = (subKey: K) => {
			const exposedSubKeys = getFromStore(store, index)
			for (const exposedSubKey of exposedSubKeys) {
				if (stringifyJson(exposedSubKey) === stringifyJson(subKey)) {
					const token = findInStore(store, family, subKey)
					socket.emit(`serve:${token.key}`, getFromStore(store, token))
					const unsubscribe = subscribeToState(
						store,
						token,
						`expose-family:${family.key}:${socket.id}`,
						({ newValue }) => {
							socket.emit(`serve:${token.key}`, newValue)
						},
					)
					unsubCallbacksByKey.set(token.key, unsubscribe)
					socket.on(`unsub:${token.key}`, () => {
						fillUnsubRequest(token.key)
					})
					break
				}
			}
		}

		socket.on(`sub:${family.key}`, fillSubRequest)

		return () => {
			socket.off(`sub:${family.key}`, fillSubRequest)

			for (const [, unsub] of unsubCallbacksByKey) {
				unsub()
			}
			unsubCallbacksByKey.clear()
		}
	}
}
