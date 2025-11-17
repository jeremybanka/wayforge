import type { Store } from "atom.io/internal"
import {
	findInStore,
	getFromStore,
	getJsonToken,
	subscribeToState,
} from "atom.io/internal"
import type { ContinuityToken, Socket, UserKey } from "atom.io/realtime"

export function providePerspectives(
	store: Store,
	socket: Socket,
	continuity: ContinuityToken,
	userKey: UserKey,
): () => void {
	const continuityKey = continuity.key
	const unsubFns = new Set<() => void>()
	for (const perspective of continuity.perspectives) {
		const { viewAtoms } = perspective
		const userViewState = findInStore(store, viewAtoms, userKey)
		const unsubscribeFromUserView = subscribeToState(
			store,
			userViewState,
			`sync-continuity:${continuityKey}:${userKey}:perspective:${perspective.resourceAtoms.key}`,
			({ oldValue, newValue }) => {
				const oldKeys = oldValue?.map((token) => token.key)
				const newKeys = newValue.map((token) => token.key)
				const concealed = oldValue?.filter(
					(token) => !newKeys.includes(token.key),
				)
				const revealed = newValue
					.filter((token) => !oldKeys?.includes(token.key))
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
					socket.emit(`reveal:${continuityKey}`, revealed)
				}
				if (concealed && concealed.length > 0) {
					socket.emit(`conceal:${continuityKey}`, concealed)
				}
			},
		)
		unsubFns.add(unsubscribeFromUserView)
	}
	return () => {
		for (const unsubscribe of unsubFns) unsubscribe()
	}
}
