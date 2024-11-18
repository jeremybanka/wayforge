import type { WritableToken } from "atom.io"
import type { Store } from "atom.io/internal"
import { findInStore, getFromStore, subscribeToState } from "atom.io/internal"
import type { Actual, AnyAliasKey, ContinuityToken } from "atom.io/realtime"

import type { Socket } from ".."
import type { UserKey } from "../realtime-server-stores"

export function subscribeToContinuityPerspectives(
	store: Store,
	continuity: ContinuityToken,
	userKey: UserKey<Actual>,
	socket: Socket | null,
): (() => void)[] {
	const continuityKey = continuity.key
	const unsubFns: (() => void)[] = []
	for (const perspective of continuity.perspectives) {
		const { userViewAtoms: viewAtoms, resourceFamilies } = perspective
		const userViewState = findInStore(store, viewAtoms, userKey)
		const unsubscribeFromUserView = subscribeToState(
			userViewState,
			({ oldValue: oldKeys, newValue: newKeys }) => {
				const newAliasesSet = new Set(new Map(oldKeys).values())
				const oldAliasesSet = new Set(new Map(newKeys).values())
				const concealed: AnyAliasKey[] = []
				for (const aliasKey of oldAliasesSet) {
					if (!newAliasesSet.has(aliasKey)) {
						concealed.push(aliasKey)
					}
				}
				const revealed: [WritableToken<any, string>, any][] = []
				for (const [actualKey, aliasKey] of newKeys) {
					if (!oldAliasesSet.has(aliasKey)) {
						for (const [, maskedResourceFamily] of resourceFamilies) {
							const maskedResourceToken = findInStore(
								store,
								maskedResourceFamily,
								`T$--mask==${userKey}++${actualKey}`,
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
			`sync-continuity:${continuityKey}:${userKey}:perspective:${perspective.userViewAtoms.key}`,
			store,
		)
		unsubFns.push(unsubscribeFromUserView)
	}
	return unsubFns
}
