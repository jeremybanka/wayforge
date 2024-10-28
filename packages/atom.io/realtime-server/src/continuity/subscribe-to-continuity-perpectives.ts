import type { Store } from "atom.io/internal"
import {
	findInStore,
	getFromStore,
	getJsonToken,
	subscribeToState,
} from "atom.io/internal"
import type { ContinuityToken } from "atom.io/realtime"

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
		const { viewAtoms } = perspective
		const userViewState = findInStore(store, viewAtoms, userKey)
		const unsubscribeFromUserView = subscribeToState(
			userViewState,
			({ oldValue, newValue }) => {
				const oldKeys = oldValue.map((token) => token.key)
				const newKeys = newValue.map((token) => token.key)
				const concealed = oldValue.filter(
					(token) => !newKeys.includes(token.key),
				)
				const revealed = newValue
					.filter((token) => !oldKeys.includes(token.key))
					.flatMap((token) => {
						const resourceToken =
							token.type === `mutable_atom` ? getJsonToken(store, token) : token
						const resource = getFromStore(store, resourceToken)
						return [resourceToken, resource]
					})
				store.logger.info(
					`👁`,
					`atom`,
					perspective.resourceAtoms.key,
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
			`sync-continuity:${continuityKey}:${userKey}:perspective:${perspective.resourceAtoms.key}`,
			store,
		)
		unsubFns.push(unsubscribeFromUserView)
	}
	return unsubFns
}
