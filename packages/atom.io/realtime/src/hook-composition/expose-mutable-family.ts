import * as AtomIO from "atom.io"
import type { Json } from "atom.io/json"
import { parseJson } from "atom.io/json"
import type { MutableAtomFamily } from "atom.io/mutable"
import { getJsonToken, getTrackerToken } from "atom.io/mutable"

import type { Transceiver } from "~/packages/anvl/reactivity/transceiver"

import type { ServerConfig } from ".."

export const useExposeMutableFamily = ({ socket, store }: ServerConfig) => {
	return function exposeMutableFamily<
		T extends Transceiver<Json.Serializable>,
		J extends Json.Serializable,
	>(
		family: MutableAtomFamily<T, J, Json.Serializable>,
		index: AtomIO.StateToken<Set<string>>,
	): () => void {
		const unsubSingleCallbacksByKey = new Map<string, () => void>()
		const unsubFamilyCallbacksByKey = new Map<string, () => void>()

		const fillFamilyUnsubRequest = () => {
			unsubFamilyCallbacksByKey.forEach((unsub) => unsub())
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

		const fillSubRequest = (subKey?: AtomIO.Json.Serializable) => {
			if (subKey === undefined) {
				const keys = AtomIO.getState(index, store)
				keys.forEach((key) => {
					const token = family(key)
					const jsonToken = getJsonToken(token)
					socket.emit(
						`init:${family.key}`,
						parseJson(jsonToken.family?.subKey || `null`),
						AtomIO.getState(jsonToken, store),
					)
				})

				const unsubscribeFromTokenCreation = family.subject.subscribe(
					`expose-family:${socket.id}`,
					(token) => {
						const jsonToken = getJsonToken(token)
						const unsub = AtomIO.subscribe(
							jsonToken,
							({ newValue }) => {
								socket.emit(
									`init:${family.key}`,
									parseJson(jsonToken.family?.subKey || `null`),
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

				const jsonToken = getJsonToken(token)
				const trackerToken = getTrackerToken(token)
				socket.emit(`init:${jsonToken.key}`, AtomIO.getState(jsonToken, store))
				const unsubscribe = AtomIO.subscribe(
					trackerToken,
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
			unsubFamilyCallbacksByKey.forEach((unsub) => unsub())
			unsubSingleCallbacksByKey.forEach((unsub) => unsub())
			unsubFamilyCallbacksByKey.clear()
			unsubSingleCallbacksByKey.clear()
		}
	}
}
