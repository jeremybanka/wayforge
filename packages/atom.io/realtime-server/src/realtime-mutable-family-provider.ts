import type * as AtomIO from "atom.io"
import type { Transceiver } from "atom.io/internal"
import {
	findInStore,
	getFromStore,
	getJsonToken,
	getUpdateToken,
	IMPLICIT,
	subscribeToState,
} from "atom.io/internal"
import type { Canonical, Json } from "atom.io/json"
import { stringifyJson } from "atom.io/json"

import type { ServerConfig } from "."

export type MutableFamilyProvider = ReturnType<
	typeof realtimeMutableFamilyProvider
>
export function realtimeMutableFamilyProvider({
	socket,
	store = IMPLICIT.STORE,
}: ServerConfig) {
	return function mutableFamilyProvider<
		T extends Transceiver<any>,
		J extends Json.Serializable,
		K extends Canonical,
	>(
		family: AtomIO.MutableAtomFamilyToken<T, J, K>,
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
					getFromStore(store, token)
					const jsonToken = getJsonToken(store, token)
					const updateToken = getUpdateToken(token)
					socket.emit(`init:${token.key}`, getFromStore(store, jsonToken))
					const unsubscribe = subscribeToState(
						updateToken,
						({ newValue }) => {
							socket.emit(`next:${token.key}`, newValue)
						},
						`expose-family:${family.key}:${socket.id}`,
						store,
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
