import type * as AtomIO from "atom.io"
import {
	findInStore,
	getFromStore,
	IMPLICIT,
	subscribeToState,
} from "atom.io/internal"
import type { Canonical, Json, stringified } from "atom.io/json"
import { stringifyJson } from "atom.io/json"
import { employSocket } from "atom.io/realtime"

import type { ServerConfig } from "."

export type FamilyProvider = ReturnType<typeof realtimeAtomFamilyProvider>
export function realtimeAtomFamilyProvider({
	socket,
	consumer,
	store = IMPLICIT.STORE,
}: ServerConfig) {
	return function familyProvider<
		J extends Json.Serializable,
		K extends Canonical,
	>(
		family: AtomIO.RegularAtomFamilyToken<J, K>,
		index: AtomIO.ReadableToken<Iterable<NoInfer<K>>> | Iterable<NoInfer<K>>,
	): () => void {
		const [dynamicIndex, staticIndex]:
			| [AtomIO.ReadableToken<Iterable<NoInfer<K>>>, undefined]
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
					store.logger.info(
						`🙈`,
						`user`,
						consumer,
						`unsubscribed from state "${token.key}"`,
					)
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
			store.logger.info(
				`👀`,
				`user`,
				consumer,
				`can subscribe to family "${family.key}"`,
			)
			coreSubscriptions.add(
				employSocket(socket, `sub:${family.key}`, (subKey: K) => {
					let exposedSubKeys: Iterable<K>
					if (dynamicIndex) {
						exposedSubKeys = getFromStore(store, dynamicIndex)
					} else {
						exposedSubKeys = staticIndex
					}
					const shouldExpose = isAvailable(exposedSubKeys, subKey)
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
