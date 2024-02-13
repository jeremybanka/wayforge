import type * as AtomIO from "atom.io"
import type { Transceiver } from "atom.io/internal"
import {
	IMPLICIT,
	findInStore,
	getFromStore,
	getJsonToken,
	getUpdateToken,
	subscribeToState,
} from "atom.io/internal"
import type { Json } from "atom.io/json"
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
		K extends Json.Serializable,
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
			const exposedSubKeys = getFromStore(index, store)
			for (const exposedSubKey of exposedSubKeys) {
				if (stringifyJson(exposedSubKey) === stringifyJson(subKey)) {
					const token = findInStore(family, subKey, store)
					const jsonToken = getJsonToken(token)
					const updateToken = getUpdateToken(token)
					socket.emit(`init:${token.key}`, getFromStore(jsonToken, store))
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
