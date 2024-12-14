import type { ReadableFamilyToken, TransactionUpdate } from "atom.io"
import { getState } from "atom.io"
import { findRelations } from "atom.io/data"
import type { Store } from "atom.io/internal"
import {
	getUpdateFamily,
	getUpdateToken,
	setIntoStore,
	subscribeToTransaction,
} from "atom.io/internal"
import type { Json, JsonIO } from "atom.io/json"
import {
	type Actual,
	type ContinuityToken,
	perspectiveAliases,
	type PerspectiveKey,
} from "atom.io/realtime"

import { type Socket, type UserKey, userUnacknowledgedQueues } from ".."
import type { TransactionResponse } from "./prepare-to-serve-transaction-request"

export function aliasTransactionUpdate(
	store: Store,
	continuity: ContinuityToken,
	userKey: UserKey<Actual>,
	update: TransactionUpdate<JsonIO>,
): TransactionResponse {
	const visibleSingletonKeys = continuity.singletonStates
		.map((atom) => {
			if (atom.type === `atom`) {
				return atom.key
			}
			return getUpdateToken(atom).key
		})
		.concat(
			continuity.singletonStatesMasked.map(({ base }) => {
				if (base.type === `atom`) {
					return base.key
				}
				return getUpdateToken(base).key
			}),
		)
		.concat(
			continuity.dynamicStates.map(({ globalIndexToken }) => {
				if (globalIndexToken.type === `mutable_atom`) {
					return getUpdateToken(globalIndexToken).key
				}
				return globalIndexToken.key
			}),
		)
		.concat(
			continuity.dynamicStatesMasked.map(({ globalIndexToken }) => {
				if (globalIndexToken.type === `mutable_atom`) {
					return getUpdateToken(globalIndexToken).key
				}
				return globalIndexToken.key
			}),
		)

	const visibleDynamicKeys = continuity.dynamicStates.flatMap(
		({ dynamicResources }) => {
			const familyKeys: string[] = []
			for (const dynamicResource of dynamicResources) {
				let resourceFamily: ReadableFamilyToken<any, string>
				resourceFamily = dynamicResource
				if (resourceFamily.type === `mutable_atom_family`) {
					familyKeys.push(getUpdateFamily(store, resourceFamily).key)
				} else {
					familyKeys.push(resourceFamily.key)
				}
			}
			return familyKeys
		},
	)
	const visibleDynamicMaskedKeys = continuity.dynamicStatesMasked.flatMap(
		({ dynamicResources }) => {
			const familyKeys: string[] = []
			for (const dynamicResource of dynamicResources) {
				let resourceFamily: ReadableFamilyToken<any, string>
				if (`mask` in dynamicResource) {
					resourceFamily = dynamicResource.mask
				} else {
					resourceFamily = dynamicResource.jsonMask
				}
				familyKeys.push(resourceFamily.key)
			}
			return familyKeys
		},
	)

	const updatesInPerspective: TransactionResponse[`updates`] = []
	for (const subUpdate of update.updates) {
		switch (subUpdate.type) {
			case `atom_update`:
				if (visibleSingletonKeys.includes(subUpdate.key)) {
					updatesInPerspective.push(subUpdate)
				}
				if (
					subUpdate.family?.key &&
					(visibleDynamicKeys.includes(subUpdate.family.key) ||
						visibleDynamicMaskedKeys.includes(subUpdate.family.key))
				) {
					updatesInPerspective.push(subUpdate)
				}
				if (subUpdate.family && subUpdate.key.includes(`__`)) {
					const segments = subUpdate.key.split(`__`)
					const familyKey = segments[0].split(`(`)[0]
					let sub = false
					for (let i = 0; i < segments.length; i++) {
						const segment = segments[i]
						if (sub) {
							const actualKey: Actual = `__${segment}__` as const
							const perspectiveKey: PerspectiveKey = `T$--perspective==${actualKey}++${userKey}`
							const aliasKey = getState(
								findRelations(perspectiveAliases, perspectiveKey)
									.aliasKeyOfPerspective,
							)
							if (aliasKey) {
								segments[i] = aliasKey
							}
						}
						sub = !sub
					}
					const maskData = continuity.masksPerFamily[familyKey]
					switch (maskData.type) {
						case `mutable`:
							{
								const signalMaskFamilyToken = maskData.signal
								const newValue = getState(
									signalMaskFamilyToken,
									subUpdate.family.subKey,
								)
								updatesInPerspective.push({
									key: segments.join(``),
									type: `atom_update`,
									family: subUpdate.family,
									newValue,
								})
							}
							break
						case `regular`: {
							const maskFamilyToken = maskData.mask
							const newValue = getState(maskFamilyToken, subUpdate.family.subKey)
							updatesInPerspective.push({
								key: segments.join(``),
								type: `atom_update`,
								family: subUpdate.family,
								newValue,
							})
						}
					}
				}
				break
			case `selector_update`:
				// this doesn't seem to actually exist in transactions
				break
			case `transaction_update`:
				updatesInPerspective.push(
					aliasTransactionUpdate(store, continuity, userKey, subUpdate),
				)
				break
			case `state_creation`:
			case `state_disposal`:
				// these don't fundamentally matter as events and can be deprecated from atom.io
				break
			case `molecule_creation`:
			case `molecule_disposal`:
				if (
					subUpdate.subType === `modern` &&
					typeof subUpdate.key === `string`
				) {
					if (subUpdate.key.includes(`__`)) {
						const segments = subUpdate.key.split(`__`)
						let sub = false
						for (const segment of segments) {
							if (sub) {
								const actualKey: Actual = `__${segment}__`
								const perspectiveKey: PerspectiveKey = `T$--perspective==${actualKey}++${userKey}`
								const aliasKey = getState(
									findRelations(perspectiveAliases, perspectiveKey)
										.perspectiveKeyOfAlias,
								)
								if (aliasKey !== null) {
									updatesInPerspective.push({
										...subUpdate,
										key: aliasKey,
									})
								}
							}
							sub = !sub
						}
					}
				}
				break
		}
	}
	const response = {
		key: update.key,
		id: update.id,
		epoch: update.epoch,
		type: `transaction_update`,
		updates: updatesInPerspective,
	} satisfies TransactionResponse

	return response
}

export function subscribeToContinuityActions(
	store: Store,
	continuity: ContinuityToken,
	userKey: UserKey<Actual>,
	socket: Socket | null,
): (() => void)[] {
	const continuityKey = continuity.key
	const unsubscribeFunctions: (() => void)[] = []

	for (const transaction of continuity.actions) {
		const unsubscribeFromTransaction = subscribeToTransaction(
			transaction,
			function continuityActionSubscriber(update) {
				try {
					const aliasedUpdate = aliasTransactionUpdate(
						store,
						continuity,
						userKey,
						update,
					)
					setIntoStore(store, userUnacknowledgedQueues, userKey, (updates) => {
						if (aliasedUpdate) {
							updates.push(aliasedUpdate)
							updates.sort((a, b) => a.epoch - b.epoch)
							store.logger.info(
								`👍`,
								`continuity`,
								continuityKey,
								`${userKey} unacknowledged update queue now has`,
								updates.length,
								`items`,
							)
						}
						return updates
					})

					socket?.emit(
						`tx-new:${continuityKey}`,
						aliasedUpdate as Json.Serializable,
					)
				} catch (thrown) {
					if (thrown instanceof Error) {
						store.logger.error(
							`❌`,
							`continuity`,
							continuityKey,
							`${userKey} failed to send update from transaction ${transaction.key} to ${userKey}`,
							thrown.message,
							thrown.stack,
						)
					}
				}
			},
			`sync-continuity:${continuityKey}:${userKey}`,
			store,
		)
		unsubscribeFunctions.push(unsubscribeFromTransaction)
	}
	return unsubscribeFunctions
}
