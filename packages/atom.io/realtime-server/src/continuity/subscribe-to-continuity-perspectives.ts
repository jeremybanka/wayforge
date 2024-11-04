import type { WritableToken } from "atom.io"
import type { Store } from "atom.io/internal"
import { findInStore, getFromStore, subscribeToState } from "atom.io/internal"
import type { Alias, ContinuityToken } from "atom.io/realtime"

import type { Socket } from ".."
import type { UserKey } from "../realtime-server-stores"

export function subscribeToContinuityPerspectives(
	store: Store,
	continuity: ContinuityToken,
	userKey: UserKey,
	socket: Socket | null,
): (() => void)[] {
	const continuityKey = continuity.key
	const unsubFns: (() => void)[] = []
	for (const perspective of continuity.perspectives) {
		const { viewAtoms, resourceFamilies } = perspective
		const userViewState = findInStore(store, viewAtoms, userKey)
		const unsubscribeFromUserView = subscribeToState(
			userViewState,
			({ oldValue: oldKeys, newValue: newKeys }) => {
				const newKeysSet = new Set(newKeys)
				const oldKeysSet = new Set(oldKeys)
				const concealed: `${string}::${Alias}`[] = []
				for (const key of oldKeys) {
					if (!newKeysSet.has(key)) {
						concealed.push(key)
					}
				}
				const revealed: [WritableToken<any, `${string}::${string}`>, any][] = []
				for (const key of newKeys) {
					if (!oldKeysSet.has(key)) {
						for (const [, maskedResourceFamily] of resourceFamilies) {
							const maskedResourceToken = findInStore(
								store,
								maskedResourceFamily,
								key,
							)
							const maskedResource = getFromStore(store, maskedResourceToken)
							revealed.push([maskedResourceToken, maskedResource])
						}
					}
				}
				store.logger.info(
					`👁`,
					`atom`,
					viewAtoms.key,
					`${userKey} has a new perspective`,
					{ oldKeys, newKeys, revealed, concealed },
				)
				if (revealed.length > 0) {
					socket?.emit(`reveal:${continuityKey}`, revealed)
				}
				if (concealed.length > 0) {
					socket?.emit(`conceal:${continuityKey}`, concealed)
				}
			},
			`sync-continuity:${continuityKey}:${userKey}:perspective:${perspective.viewAtoms.key}`,
			store,
		)
		unsubFns.push(unsubscribeFromUserView)
	}
	return unsubFns
}
