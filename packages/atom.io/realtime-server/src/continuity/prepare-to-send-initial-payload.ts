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
			const { userViewAtoms, resourceFamilies } = perspective
			const userViewAtom = findInStore(store, userViewAtoms, userKey)
			const userView = getFromStore(store, userViewAtom)
			for (const [baseFamily, maskFamily] of resourceFamilies) {
				const resourceFamily =
					baseFamily.type === `mutable_atom_family`
						? getJsonFamily(store, baseFamily)
						: baseFamily
				store.logger.info(`👁`, `atom`, maskFamily.key, `${userKey} can see`, {
					viewAtoms: userViewAtoms,
					maskFamily,
					userView,
				})
				for (const key of userView) {
					const baseToken = findInStore(store, baseFamily, key)
					const maskToken = findInStore(store, maskFamily, key)
					const resource = getFromStore(store, maskToken)
					initialPayload.push(baseToken, resource)
				}
			}
		}

		const epoch = isRootStore(store)
			? (store.transactionMeta.epoch.get(continuityKey) ?? null)
			: null

		socket?.emit(`continuity-init:${continuityKey}`, epoch, initialPayload)
	}
}
