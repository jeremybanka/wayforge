import type { ReadableFamilyToken, TokenDenomination } from "atom.io"
import type { Store } from "atom.io/internal"
import {
	findInStore,
	getFromStore,
	getJsonFamily,
	getJsonToken,
	isRootStore,
} from "atom.io/internal"
import type { Json } from "atom.io/json"
import type { Actual, ContinuityToken, MaskKey } from "atom.io/realtime"

import type { Socket, UserKey } from ".."

export function prepareToSendInitialPayload(
	store: Store,
	continuity: ContinuityToken,
	userKey: UserKey<Actual>,
	socket: Socket | null,
): () => void {
	const continuityKey = continuity.key
	return function sendInitialPayload(): void {
		const initialPayload: Json.Serializable[] = []
		for (const atom of continuity.singletonStates) {
			const resourceToken =
				atom.type === `mutable_atom` ? getJsonToken(store, atom) : atom
			const resource = getFromStore(store, resourceToken)
			initialPayload.push(resourceToken, resource)
		}
		for (const dynamic of continuity.dynamicStates) {
			const { globalIndexToken: viewAtom, dynamicResources } = dynamic
			const globalView = getFromStore(store, viewAtom)
			store.logger.info(
				`👁`,
				`atom`,
				dynamicResources.map((f) => f.key).join(`, `),
				`${userKey} can see`,
				{
					viewAtom,
					dynamicResources,
					userView: globalView,
				},
			)
			for (const key of globalView) {
				for (const dynamicResource of dynamicResources) {
					const resourceFamilyToken =
						dynamicResource.type === `mutable_atom_family`
							? getJsonFamily(store, dynamicResource)
							: dynamicResource
					const resourceToken = findInStore(store, resourceFamilyToken, key)
					const resource = getFromStore(store, resourceToken)
					initialPayload.push(resourceToken, resource)
				}
			}
		}
		for (const maskedDynamic of continuity.dynamicStatesMasked) {
			const { globalIndexToken: viewAtom, dynamicResources } = maskedDynamic
			const globalView = getFromStore(store, viewAtom)
			store.logger.info(
				`👁`,
				`atom`,
				dynamicResources
					.map((f) => (`mask` in f ? f.mask.key : f.jsonMask.key))
					.join(`, `),
				`${userKey} can see`,
				{
					viewAtom,
					dynamicResources,
					userView: globalView,
				},
			)
			for (let key of globalView) {
				for (const dynamicResource of dynamicResources) {
					let resourceFamily: ReadableFamilyToken<any, string>
					key = `T$--mask==${userKey}++${key}` satisfies MaskKey<string>
					if (`mask` in dynamicResource) {
						resourceFamily = dynamicResource.mask
					} else {
						resourceFamily = dynamicResource.jsonMask
					}
					const baseToken = findInStore(store, dynamicResource.base, key)
					const resourceToken = findInStore(store, resourceFamily, key)
					const resource = getFromStore(store, resourceToken)
					initialPayload.push(baseToken, resource)
				}
			}
		}
		for (const perspective of continuity.perspectives) {
			const { userViewAtoms, resourceFamilies } = perspective
			const userViewAtom = findInStore(store, userViewAtoms, userKey)
			const userView = getFromStore(store, userViewAtom)
			for (const [baseFamily, maskFamily] of resourceFamilies) {
				store.logger.info(`👁`, `atom`, maskFamily.key, `${userKey} can see`, {
					viewAtoms: userViewAtoms,
					maskFamily,
					userView,
				})
				for (const [actual, alias] of userView) {
					const maskKey =
						`T$--mask==${userKey}++${actual}` satisfies MaskKey<string>
					const maskToken = findInStore(store, maskFamily, maskKey)
					const fakeToken = {
						key: `${baseFamily.key}("${alias}")`,
						type: FAMILY_TYPES[baseFamily.type],
						family: { key: baseFamily.key, subKey: `"${alias}"` },
					}
					// const fakeToken = findInStore(store, resourceFamily, alias)
					const resource = getFromStore(store, maskToken)
					initialPayload.push(fakeToken, resource)
				}
			}
		}

		const epoch = isRootStore(store)
			? (store.transactionMeta.epoch.get(continuityKey) ?? null)
			: null

		socket?.emit(`continuity-init:${continuityKey}`, epoch, initialPayload)
	}
}

const FAMILY_TYPES: Record<TokenDenomination, TokenDenomination> = {
	atom_family: `atom`,
	atom: `atom`,
	continuity: `continuity`,
	molecule_family: `molecule`,
	molecule: `molecule`,
	mutable_atom_family: `mutable_atom`,
	mutable_atom: `mutable_atom`,
	readonly_selector_family: `readonly_selector`,
	readonly_selector: `readonly_selector`,
	selector_family: `selector`,
	selector: `selector`,
	state: `state`,
	timeline: `timeline`,
	unknown: `unknown`,
	transaction: `transaction`,
}
