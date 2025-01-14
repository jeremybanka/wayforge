import type { Store } from "atom.io/internal"
import {
	findInStore,
	getFromStore,
	getJsonFamily,
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
		for (const dynamic of continuity.dynamics) {
			const { viewState: viewAtom, resourceFamilies } = dynamic
			const globalView = getFromStore(store, viewAtom)
			store.logger.info(
				`👁`,
				`atom`,
				resourceFamilies.map((f) => f.key).join(`, `),
				`${userKey} can see`,
				{
					viewAtom,
					resourceFamilies,
					userView: globalView,
				},
			)
			for (const key of globalView) {
				for (const resourceFamily of resourceFamilies) {
					const resourceFamilyToken =
						resourceFamily.type === `mutable_atom_family`
							? getJsonFamily(store, resourceFamily)
							: resourceFamily
					const resourceToken = findInStore(store, resourceFamilyToken, key)
					const resource = getFromStore(store, resourceToken)
					initialPayload.push(resourceToken, resource)
				}
			}
		}
		for (const perspective of continuity.perspectives) {
			const { viewAtoms, resourceFamilies } = perspective
			const userViewState = findInStore(store, viewAtoms, userKey)
			const userView = getFromStore(store, userViewState)
			for (const [, maskFamily] of resourceFamilies) {
				store.logger.info(`👁`, `atom`, maskFamily.key, `${userKey} can see`, {
					viewAtoms,
					maskFamily,
					userView,
				})
				for (const key of userView) {
					const visibleToken = findInStore(store, maskFamily, key)
					const resourceToken =
						visibleToken.type === `mutable_atom`
							? getJsonToken(store, visibleToken)
							: visibleToken
					const resource = getFromStore(store, resourceToken)

					initialPayload.push(resourceToken, resource)
				}
			}
		}

		const epoch = isRootStore(store)
			? (store.transactionMeta.epoch.get(continuityKey) ?? null)
			: null

		socket?.emit(`continuity-init:${continuityKey}`, epoch, initialPayload)
	}
}
