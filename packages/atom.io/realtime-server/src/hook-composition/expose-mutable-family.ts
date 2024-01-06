import * as AtomIO from "atom.io"
import type { Transceiver } from "atom.io/internal"
import {
	IMPLICIT,
	getJsonToken,
	getUpdateToken,
	subscribeToState,
} from "atom.io/internal"
import type { Json } from "atom.io/json"
import { parseJson } from "atom.io/json"

import type { ServerConfig } from ".."

export const useExposeMutableFamily = ({
	socket,
	store = IMPLICIT.STORE,
}: ServerConfig) => {
	return function exposeMutableFamily<
		Family extends AtomIO.MutableAtomFamily<
			Transceiver<Json.Serializable>,
			Json.Serializable,
			Json.Serializable
		>,
	>(family: Family, index: AtomIO.WritableToken<Set<string>>): () => void {
		type FamilyKey = Family extends AtomIO.MutableAtomFamily<
			Transceiver<any>,
			any,
			infer Key
		>
			? Key
			: never

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

		const fillSubRequest = (subKey?: FamilyKey) => {
			if (subKey === undefined) {
				const keys = AtomIO.getState(index, store)
				for (const key of keys) {
					const token = family(key)
					const jsonToken = getJsonToken(token)
					const trackerToken = getUpdateToken(token)
					socket.emit(
						`init:${family.key}`,
						parseJson(jsonToken.family?.subKey || `null`),
						AtomIO.getState(jsonToken, store),
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
							AtomIO.getState(jsonToken, store),
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
				socket.emit(`init:${token.key}`, AtomIO.getState(jsonToken, store))
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
