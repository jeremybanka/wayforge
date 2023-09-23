import * as AtomIO from "atom.io"
import { getJsonToken, getUpdateToken } from "atom.io/internal"
import type { Json } from "atom.io/json"
import { parseJson } from "atom.io/json"

import type { Transceiver } from "~/packages/anvl/reactivity/transceiver"

import type { ServerConfig } from ".."

export const useExposeMutableFamily = ({ socket, store }: ServerConfig) => {
	return function exposeMutableFamily<
		Family extends AtomIO.MutableAtomFamily<
			Transceiver<Json.Serializable>,
			Json.Serializable,
			Json.Serializable
		>,
	>(family: Family, index: AtomIO.StateToken<Set<string>>): () => void {
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

		const fillSubRequest = (subKey?: FamilyKey) => {
			if (subKey === undefined) {
				const keys = AtomIO.getState(index, store)
				keys.forEach((key) => {
					const token = family(key)
					const jsonToken = getJsonToken(token)
					const trackerToken = getUpdateToken(token)
					socket.emit(
						`init:${family.key}`,
						parseJson(jsonToken.family?.subKey || `null`),
						AtomIO.getState(jsonToken, store),
					)
					const unsubFromUpdates = AtomIO.subscribe(
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
				})
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
						const unsubFromUpdates = AtomIO.subscribe(
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
				const unsubscribe = AtomIO.subscribe(
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
			unsubFamilyCallbacksByKey.forEach((unsub) => unsub())
			unsubSingleCallbacksByKey.forEach((unsub) => unsub())
			unsubFamilyCallbacksByKey.clear()
			unsubSingleCallbacksByKey.clear()
		}
	}
}
