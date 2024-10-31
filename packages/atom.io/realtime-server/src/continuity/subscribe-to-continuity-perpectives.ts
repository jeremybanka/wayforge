import type { WritableToken } from "atom.io"
import type { Store } from "atom.io/internal"
import {
	findInStore,
	getFromStore,
	getJsonFamily,
	subscribeToState,
} from "atom.io/internal"
import type { ContinuityToken } from "atom.io/realtime"

import type { Socket } from ".."
import type { Alias, UserKey } from "../realtime-server-stores"

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
				const revealed: [WritableToken<any, `${string}::${Alias}`>, any][] = []
				for (const key of newKeys) {
					if (!oldKeysSet.has(key)) {
						for (const [, maskedFamily] of resourceFamilies) {
							const familyToken =
								maskedFamily.type === `mutable_atom_family`
									? getJsonFamily(store, maskedFamily)
									: maskedFamily
							const resourceToken = findInStore(store, familyToken, key)
							const resource = getFromStore(store, resourceToken)
							revealed.push([resourceToken, resource])
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
