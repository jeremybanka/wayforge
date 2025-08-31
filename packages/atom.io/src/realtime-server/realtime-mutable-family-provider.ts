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
import type { Canonical } from "atom.io/json"
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
		T extends Transceiver<any, any, any>,
		K extends Canonical,
	>(
		family: AtomIO.MutableAtomFamilyToken<T, K>,
		index: AtomIO.ReadableToken<Iterable<K>>,
	): () => void {
		const heldSubscriptionsByKey = new Map<string, () => void>()

		const fillUnsubRequest = (key: string) => {
			socket.off(`unsub:${key}`, fillUnsubRequest)
			const unsub = heldSubscriptionsByKey.get(key)
			if (unsub) {
				unsub()
				heldSubscriptionsByKey.delete(key)
			}
		}

		const doExpose = (subKey: K) => {
			const token = findInStore(store, family, subKey)
			getFromStore(store, token)
			const jsonToken = getJsonToken(store, token)
			const updateToken = getUpdateToken(token)
			socket.emit(`init:${token.key}`, getFromStore(store, jsonToken))
			const unsubscribe = subscribeToState(
				store,
				updateToken,
				`expose-family:${family.key}:${socket.id}`,
				({ newValue }) => {
					socket.emit(`next:${token.key}`, newValue)
				},
			)
			heldSubscriptionsByKey.set(token.key, unsubscribe)
			socket.on(`unsub:${token.key}`, () => {
				fillUnsubRequest(token.key)
			})
		}

		const isExposed = (exposedSubKeys: Iterable<K>, subKey: K): boolean => {
			for (const exposedSubKey of exposedSubKeys) {
				if (stringifyJson(exposedSubKey) === stringifyJson(subKey)) {
					return true
				}
			}
			return false
		}

		const fillSubRequest = (subKey: K) => {
			const exposedSubKeys = getFromStore(store, index)
			const shouldExpose = isExposed(exposedSubKeys, subKey)
			if (shouldExpose) {
				doExpose(subKey)
			} else {
				const indexSubscription = subscribeToState(
					store,
					index,
					`expose-family:${family.key}:${socket.id}`,
					({ newValue: newExposedSubKeys }) => {
						if (isExposed(newExposedSubKeys, subKey)) {
							doExpose(subKey)
						}
					},
				)
				heldSubscriptionsByKey.set(index.key, indexSubscription)
			}
		}

		socket.on(`sub:${family.key}`, fillSubRequest)

		return () => {
			socket.off(`sub:${family.key}`, fillSubRequest)
			for (const [, unsub] of heldSubscriptionsByKey) {
				unsub()
			}
			heldSubscriptionsByKey.clear()
		}
	}
}
