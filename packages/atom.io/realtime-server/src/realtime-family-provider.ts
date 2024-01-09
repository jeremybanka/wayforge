import * as AtomIO from "atom.io"
import { IMPLICIT, subscribeToState } from "atom.io/internal"
import type { Json } from "atom.io/json"
import { parseJson } from "atom.io/json"

import type { ServerConfig } from "."

export function realtimeFamilyProvider({
	socket,
	store = IMPLICIT.STORE,
}: ServerConfig) {
	return function familyProvider<J extends Json.Serializable>(
		family: AtomIO.WritableFamily<J, Json.Serializable>,
		index: AtomIO.ReadableToken<Iterable<string>>,
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

		const fillSubRequest = (subKey?: Json.Serializable) => {
			if (subKey === undefined) {
				const keys = AtomIO.getState(index, store)
				for (const key of keys) {
					const token = family(key)
					socket.emit(
						`serve:${family.key}`,
						parseJson(token.family?.subKey || `null`),
						AtomIO.getState(token, store),
					)
				}

				const unsubscribeFromTokenCreation = family.subject.subscribe(
					`expose-family:${socket.id}`,
					(token: AtomIO.WritableToken<J>) => {
						const unsub = subscribeToState(
							token,
							({ newValue }) => {
								socket.emit(
									`serve:${family.key}`,
									parseJson(token.family?.subKey || `null`),
									newValue,
								)
							},
							`expose-family:${family.key}:${socket.id}`,
							store,
						)
						unsubFamilyCallbacksByKey.set(token.key, unsub)
					},
				)
				unsubFamilyCallbacksByKey.set(family.key, unsubscribeFromTokenCreation)

				socket.on(`unsub:${family.key}`, fillFamilyUnsubRequest)
			} else {
				const token = family(subKey)
				socket.emit(`serve:${token.key}`, AtomIO.getState(token, store))
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
