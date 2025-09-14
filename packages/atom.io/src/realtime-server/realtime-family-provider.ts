import type * as AtomIO from "atom.io"
import {
	findInStore,
	getFromStore,
	IMPLICIT,
	subscribeToState,
} from "atom.io/internal"
import type { Canonical, Json, stringified } from "atom.io/json"
import { stringifyJson } from "atom.io/json"

import type { ServerConfig } from "."
import { employSocket } from "atom.io/realtime"

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
		const coreSubscriptions = new Set<() => void>()
		const clearCoreSubscriptions = () => {
			for (const unsub of coreSubscriptions) unsub()
			coreSubscriptions.clear()
		}
		const familyMemberSubscriptionsWanted = new Set<stringified<K>>()
		const familyMemberSubscriptions = new Map<string, () => void>()
		const clearFamilySubscriptions = () => {
			for (const unsub of familyMemberSubscriptions.values()) unsub()
			familyMemberSubscriptions.clear()
		}

		const fillUnsubRequest = (key: string) => {
			const unsubUnsub = familyMemberSubscriptions.get(`${key}:unsub`)
			if (unsubUnsub) {
				unsubUnsub()
				familyMemberSubscriptions.delete(`${key}:unsub`)
			}
			const unsub = familyMemberSubscriptions.get(key)
			if (unsub) {
				unsub()
				familyMemberSubscriptions.delete(key)
			}
		}

		const exposeFamilyMembers = (subKey: K) => {
			const token = findInStore(store, family, subKey)
			getFromStore(store, token)
			socket.emit(`serve:${token.key}`, getFromStore(store, token))
			familyMemberSubscriptions.set(
				token.key,
				subscribeToState(
					store,
					token,
					`expose-family:${family.key}:${socket.id}`,
					({ newValue }) => {
						socket.emit(`serve:${token.key}`, newValue)
					},
				),
			)
			familyMemberSubscriptions.set(
				`${token.key}:unsub`,
				employSocket(socket, `unsub:${token.key}`, () => {
					fillUnsubRequest(token.key)
				}),
			)
		}

		const isAvailable = (exposedSubKeys: Iterable<K>, subKey: K): boolean => {
			for (const exposedSubKey of exposedSubKeys) {
				if (stringifyJson(exposedSubKey) === stringifyJson(subKey)) {
					return true
				}
			}
			return false
		}

		const start = () => {
			coreSubscriptions.add(
				employSocket(socket, `sub:${family.key}`, (subKey: K) => {
					const exposedSubKeys = getFromStore(store, index)
					const shouldExpose = isAvailable(exposedSubKeys, subKey)
					if (shouldExpose) {
						exposeFamilyMembers(subKey)
					} else {
						familyMemberSubscriptionsWanted.add(stringifyJson(subKey))
						socket.emit(`unavailable:${family.key}`, subKey)
					}
				}),
			)
			coreSubscriptions.add(
				subscribeToState(
					store,
					index,
					`expose-family:${family.key}:${socket.id}`,
					({ newValue: newExposedSubKeys }) => {
						for (const subKey of newExposedSubKeys) {
							if (familyMemberSubscriptionsWanted.has(stringifyJson(subKey))) {
								exposeFamilyMembers(subKey)
							}
						}
					},
				),
			)
		}

		start()

		return () => {
			clearCoreSubscriptions()
			clearFamilySubscriptions()
		}
	}
}
