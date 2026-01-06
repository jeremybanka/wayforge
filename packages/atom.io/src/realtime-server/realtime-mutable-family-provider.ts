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
import type { Canonical, stringified } from "atom.io/json"
import { stringifyJson } from "atom.io/json"
import { employSocket } from "atom.io/realtime"

import type { ServerConfig } from "."

const isAvailable = <K extends Canonical>(
	exposedSubKeys: Iterable<K>,
	subKey: K,
): boolean => {
	for (const exposedSubKey of exposedSubKeys) {
		if (stringifyJson(exposedSubKey) === stringifyJson(subKey)) {
			return true
		}
	}
	return false
}

export type MutableFamilyProvider = ReturnType<
	typeof realtimeMutableFamilyProvider
>
export function realtimeMutableFamilyProvider({
	socket,
	consumer,
	store = IMPLICIT.STORE,
}: ServerConfig) {
	return function mutableFamilyProvider<
		T extends Transceiver<any, any, any>,
		K extends Canonical,
	>(
		family: AtomIO.MutableAtomFamilyToken<T, K>,
		index:
			| AtomIO.ReadableToken<Iterable<NoInfer<K>> | null>
			| Iterable<NoInfer<K>>,
	): () => void {
		const [dynamicIndex, staticIndex]:
			| [AtomIO.ReadableToken<Iterable<NoInfer<K>> | null>, undefined]
			| [undefined, Iterable<NoInfer<K>>] = (() => {
			if (typeof index === `object` && `key` in index && `type` in index) {
				return [index, undefined] as const
			}
			return [undefined, index] as const
		})()

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
			const jsonToken = getJsonToken(store, token)
			const updateToken = getUpdateToken(token)
			socket.emit(`init:${token.key}`, getFromStore(store, jsonToken))
			familyMemberSubscriptions.set(
				token.key,
				subscribeToState(
					store,
					updateToken,
					`expose-family:${family.key}:${socket.id}`,
					({ newValue }) => {
						socket.emit(`next:${token.key}`, newValue)
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

		const start = () => {
			store.logger.info(
				`👀`,
				`user`,
				consumer,
				`can subscribe to family "${family.key}"`,
			)
			coreSubscriptions.add(
				employSocket(socket, `sub:${family.key}`, (subKey: K) => {
					let exposedSubKeys: Iterable<K> | null
					if (dynamicIndex) {
						exposedSubKeys = getFromStore(store, dynamicIndex)
					} else {
						exposedSubKeys = staticIndex
					}
					const shouldExpose =
						exposedSubKeys && isAvailable(exposedSubKeys, subKey)
					if (shouldExpose) {
						store.logger.info(
							`👀`,
							`user`,
							consumer,
							`is approved for a subscription to`,
							subKey,
							`in family "${family.key}"`,
						)
						exposeFamilyMembers(subKey)
					} else {
						store.logger.info(
							`❌`,
							`user`,
							consumer,
							`is denied for a subscription to`,
							subKey,
							`in family "${family.key}"`,
						)
						familyMemberSubscriptionsWanted.add(stringifyJson(subKey))
						socket.emit(`unavailable:${family.key}`, subKey)
					}
				}),
			)
			if (dynamicIndex) {
				coreSubscriptions.add(
					subscribeToState(
						store,
						dynamicIndex,
						`expose-family:${family.key}:${socket.id}`,
						({ newValue: newExposedSubKeys }) => {
							store.logger.info(
								`👀`,
								`user`,
								consumer,
								`has the following keys available for family "${family.key}"`,
								newExposedSubKeys,
							)
							if (newExposedSubKeys === null) return
							for (const subKey of newExposedSubKeys) {
								if (familyMemberSubscriptionsWanted.has(stringifyJson(subKey))) {
									store.logger.info(
										`👀`,
										`user`,
										consumer,
										`is retroactively approved for a subscription to`,
										subKey,
										`in family "${family.key}"`,
									)
									exposeFamilyMembers(subKey)
								}
							}
						},
					),
				)
			}
		}

		start()

		return () => {
			clearCoreSubscriptions()
			clearFamilySubscriptions()
		}
	}
}
