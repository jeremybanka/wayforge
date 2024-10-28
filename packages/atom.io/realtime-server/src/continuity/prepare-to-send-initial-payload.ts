import type { Store } from "atom.io/internal"
import {
	findInStore,
	getFromStore,
	getJsonToken,
	isRootStore,
} from "atom.io/internal"
import type { Json } from "atom.io/json"
import type { ContinuityToken } from "atom.io/realtime"

import type { Socket, UserKey } from ".."

export function prepareToSendInitialPayload(
	store: Store,
	continuity: ContinuityToken,
	userKey: UserKey,
	socket: Socket | null,
): () => void {
	const continuityKey = continuity.key
	return function sendInitialPayload(): void {
		const initialPayload: Json.Serializable[] = []
		for (const atom of continuity.globals) {
			const resourceToken =
				atom.type === `mutable_atom` ? getJsonToken(store, atom) : atom
			const resource = getFromStore(store, resourceToken)
			initialPayload.push(resourceToken, resource)
		}
		for (const perspective of continuity.perspectives) {
			const { viewAtoms, resourceAtoms } = perspective
			const userViewState = findInStore(store, viewAtoms, userKey)
			const userView = getFromStore(store, userViewState)
			store.logger.info(`👁`, `atom`, resourceAtoms.key, `${userKey} can see`, {
				viewAtoms,
				resourceAtoms,
				userView,
			})
			for (const visibleToken of userView) {
				const resourceToken =
					visibleToken.type === `mutable_atom`
						? getJsonToken(store, visibleToken)
						: visibleToken
				const resource = getFromStore(store, resourceToken)

				initialPayload.push(resourceToken, resource)
			}
		}

		const epoch = isRootStore(store)
			? (store.transactionMeta.epoch.get(continuityKey) ?? null)
			: null

		socket?.emit(`continuity-init:${continuityKey}`, epoch, initialPayload)
	}
}
