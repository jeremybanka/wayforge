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
import { parseJson } from "atom.io/json"

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
		family: AtomIO.MutableAtomFamily<T, J, K>,
		index: AtomIO.ReadableToken<Iterable<K>>,
	): () => void {
		const unsubSingleCallbacksByKey = new Map<string, () => void>()
		const unsubFamilyCallbacksByKey = new Map<string, () => void>()

		const fillFamilyUnsubRequest = () => {
			for (const [, unsub] of unsubFamilyCallbacksByKey) {
				unsub()
			}
			unsubFamilyCallbacksByKey.clear()
			socket.off(`unsub:${family.key}`, fillFamilyUnsubRequest)
		}

		const fillSingleUnsubRequest = (key: string) => {
			socket.off(`unsub:${key}`, fillSingleUnsubRequest)
			const unsub = unsubSingleCallbacksByKey.get(key)
			if (unsub) {
				unsub()
				unsubSingleCallbacksByKey.delete(key)
			}
		}

		const fillSubRequest = (subKey?: K) => {
			if (subKey === undefined) {
				const keys = getFromStore(index, store)
				for (const key of keys) {
					const token = findInStore(family, key, store)
					const jsonToken = getJsonToken(token)
					const trackerToken = getUpdateToken(token)
					socket.emit(
						`init:${family.key}`,
						parseJson(jsonToken.family?.subKey || `null`),
						getFromStore(jsonToken, store),
					)
					const unsubFromUpdates = subscribeToState(
						trackerToken,
						({ newValue }) => {
							socket.emit(
								`next:${token.key}`,
								parseJson(jsonToken.family?.subKey || `null`),
								newValue,
							)
						},
						`expose-family:${family.key}:${socket.id}`,
						store,
					)
					unsubFamilyCallbacksByKey.set(token.key, unsubFromUpdates)
				}
				const unsubscribeFromTokenCreation = family.subject.subscribe(
					`expose-family:${socket.id}`,
					(token) => {
						const jsonToken = getJsonToken(token)
						const trackerToken = getUpdateToken(token)
						socket.emit(
							`init:${family.key}`,
							parseJson(jsonToken.family?.subKey || `null`),
							getFromStore(jsonToken, store),
						)
						const unsubFromUpdates = subscribeToState(
							trackerToken,
							({ newValue }) => {
								socket.emit(
									`next:${token.key}`,
									parseJson(jsonToken.family?.subKey || `null`),
									newValue,
								)
							},
							`expose-family:${family.key}:${socket.id}`,
							store,
						)
						unsubFamilyCallbacksByKey.set(token.key, unsubFromUpdates)
					},
				)
				unsubFamilyCallbacksByKey.set(family.key, unsubscribeFromTokenCreation)

				socket.on(`unsub:${family.key}`, fillFamilyUnsubRequest)
			} else {
				const token = family(subKey)
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
				unsubSingleCallbacksByKey.set(token.key, unsubscribe)
				socket.on(`unsub:${token.key}`, () => {
					fillSingleUnsubRequest(token.key)
				})
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
