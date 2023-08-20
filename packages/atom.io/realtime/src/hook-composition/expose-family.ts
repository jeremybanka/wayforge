import type { Json } from "anvl/json"
import { parseJson } from "anvl/json"
import * as AtomIO from "atom.io"

import type { ServerConfig } from ".."

const subscribeToTokenCreation = <T>(
	family: AtomIO.AtomFamily<T> | AtomIO.SelectorFamily<T>,
	handleTokenCreation: (token: AtomIO.StateToken<T>) => void,
): (() => void) => {
	const subscription =
		family.type === `atom_family`
			? family.subject.subscribe(handleTokenCreation)
			: family.subject.subscribe(handleTokenCreation)
	return () => subscription.unsubscribe()
}

/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
export const useExposeFamily = ({ socket, store }: ServerConfig) => {
	return function exposeFamily<J extends Json.Serializable>(
		family: AtomIO.AtomFamily<J> | AtomIO.SelectorFamily<J>,
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
					socket.emit(
						`serve:${family.key}`,
						parseJson(token.family?.subKey || `null`),
						AtomIO.getState(token, store),
					)
				})

				const unsubscribeFromTokenCreation = subscribeToTokenCreation(
					family,
					(token) => {
						const unsub = AtomIO.subscribe(
							token,
							({ newValue }) => {
								socket.emit(
									`serve:${family.key}`,
									parseJson(token.family?.subKey || `null`),
									newValue,
								)
							},
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
				const unsubscribe = AtomIO.subscribe(
					token,
					({ newValue }) => {
						socket.emit(`serve:${token.key}`, newValue)
					},
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
