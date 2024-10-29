import type { CompoundTypedKey } from "atom.io"
import {
	atom,
	atomFamily,
	decomposeCompoundKey,
	getState,
	selectorFamily,
} from "atom.io"
import { editRelations, findRelations, join } from "atom.io/data"
import type { stringified } from "atom.io/json"
import type { SetRTXJson } from "atom.io/transceivers/set-rtx"
import { SetRTX } from "atom.io/transceivers/set-rtx"

import type {
	JsonTxUpdate,
	TransactionRequest,
} from "../continuity/prepare-to-serve-transaction-request"
import type { UserKey } from "./server-user-store"

// CLEAN ////////////////////////////////////////////////////////////////////////

export type Actual = `__${string}__`
export type Proxy = `$$${string}$$`

export const VISIBILITY_CONDITIONS = [
	`secret`, // key cannot be emitted; data cannot be emitted
	`masked`, // key is spoofed; data can be masked
] as const
export type VisibilityCondition = (typeof VISIBILITY_CONDITIONS)[number]

export type TransactionUpdateActual = JsonTxUpdate & { proxy?: false }
export type TransactionUpdateProxy = JsonTxUpdate & { proxy?: true }
export type TransactionRequestProxy = TransactionRequest & { proxy?: true }
export type TransactionRequestActual = TransactionRequest & { proxy?: false }

// MIXED ////////////////////////////////////////////////////////////////////////

export const itemPerspectiveIndices = selectorFamily<ItemKey<Proxy>[], UserKey>({
	key: `itemPerspectiveIndices`,
	get:
		(userKey) =>
		({ get }) => {
			const allItemKeys = get(itemGlobalIndex)
			const visibleItemKeys: ItemKey<Proxy>[] = []
			for (const realItemKey of allItemKeys) {
				const itemPerspectiveKey =
					`T$--perspective==${realItemKey}++${userKey}` satisfies ItemPerspectiveKey
				const itemVisibilityCondition = get(
					itemVisibilityConditionSelectors,
					itemPerspectiveKey,
				)
				switch (itemVisibilityCondition) {
					case `secret`:
						break
					case `masked`:
						{
							let proxyKey: ItemKey<Proxy>
							const maybeProxyKey = get(
								findRelations(itemKeyProxies, itemPerspectiveKey)
									.proxyKeyOfItemPerspective,
							)
							if (maybeProxyKey) {
								proxyKey = maybeProxyKey
							} else {
								proxyKey = `item::$$${crypto.randomUUID()}$$`
								editRelations(itemKeyProxies, (relations) => {
									relations.set({
										itemPerspective: itemPerspectiveKey,
										proxy: proxyKey,
									})
								})
							}
							visibleItemKeys.push(proxyKey)
						}
						break
				}
			}
			return visibleItemKeys
		},
})

export function derefTransactionRequest(
	userKey: UserKey,
	request: stringified<TransactionRequestProxy>,
): Error | stringified<TransactionRequestActual> {
	const segments = request.split(`$$`)
	let sub = false
	for (let i = 0; i < segments.length; i++) {
		if (sub) {
			const segmentRaw = segments[i]
			const proxyItemKey = `item::$$${segmentRaw}$$` satisfies ItemKey<Proxy>
			const itemPerspectiveKey = getState(
				findRelations(itemKeyProxies, proxyItemKey).itemPerspectiveKeyOfProxy,
			)
			if (itemPerspectiveKey === null) {
				return new Error(
					`Attempted to dereference a transaction request with a proxy reference that does not exist: "${segmentRaw}".`,
				)
			}
			const [, itemKeyActual, ownerKey] =
				decomposeCompoundKey(itemPerspectiveKey)
			if (ownerKey !== userKey) {
				return new Error(
					`Attempted to dereference a transaction request with a proxy reference from a different user.`,
				)
			}
			segments[i] = itemKeyActual
		}
		sub = !sub
	}
	return segments.join(``)
}

export function proxyTransactionUpdate(
	userKey: UserKey,
	update: TransactionUpdateActual,
): TransactionUpdateProxy {
	const updatesInPerspective: TransactionUpdateProxy[`updates`] = []
	for (const subUpdate of update.updates) {
		switch (subUpdate.type) {
			case `atom_update`:
				updatesInPerspective.push(subUpdate)
				if (subUpdate.key.includes(`__`)) {
					const segments = subUpdate.key.split(`__`)
					let sub = false
					for (let i = 0; i < segments.length; i++) {
						if (sub) {
							const segmentRaw = segments[i]
							const actualItemKey =
								`item::__${segmentRaw}__` satisfies ItemKey<Actual>
							const itemPerspectiveKey =
								`T$--perspective==${actualItemKey}++${userKey}` satisfies ItemPerspectiveKey
							const proxyItemKey = getState(
								findRelations(itemKeyProxies, itemPerspectiveKey)
									.proxyKeyOfItemPerspective,
							)
							if (proxyItemKey !== null) {
								updatesInPerspective.push({
									...subUpdate,
								})
							}
						}
						sub = !sub
					}
				}
		}
	}
	const proxyUpdate = {
		...update,
		proxy: true,
		updates: updatesInPerspective,
	} satisfies TransactionUpdateProxy
	return proxyUpdate
}

// DIRTY ////////////////////////////////////////////////////////////////////////

export type UnitKey<K extends Actual | Proxy = Actual | Proxy> = `unit::${K}`
export function isUnitKey(key: unknown): key is UnitKey {
	return typeof key === `string` && key.startsWith(`unit::`)
}
export function isUnitKeyActual(key: unknown): key is UnitKey<Actual> {
	return typeof key === `string` && key.startsWith(`unit::__`)
}
export function isUnitKeyProxy(key: unknown): key is UnitKey<Proxy> {
	return typeof key === `string` && key.startsWith(`unit::$$`)
}

export type ItemKey<K extends Actual | Proxy = Actual | Proxy> = `item::${K}`
export function isItemKey(key: unknown): key is ItemKey {
	return typeof key === `string` && key.startsWith(`item::`)
}
export function isItemKeyProxy(key: unknown): key is ItemKey<Proxy> {
	return typeof key === `string` && key.startsWith(`item::$$`)
}
export function isItemKeyActual(key: unknown): key is ItemKey<Actual> {
	return typeof key === `string` && key.startsWith(`item::__`)
}

export type ItemPerspectiveKey = CompoundTypedKey<
	`perspective`,
	ItemKey<Actual>,
	UserKey
>
export function isItemPerspectiveKey(key: unknown): key is ItemPerspectiveKey {
	return typeof key === `string` && key.startsWith(`T$--perspective==item::__`)
}

export const itemVisibilityConditionSelectors = selectorFamily<
	VisibilityCondition,
	ItemPerspectiveKey
>({
	key: `itemVisibilityCondition`,
	get: (_) => (__) => {
		return `masked`
	},
})

export const itemGlobalIndex = atom<
	SetRTX<ItemKey<Actual>>,
	SetRTXJson<ItemKey<Actual>>
>({
	key: `itemGlobalIndex`,
	mutable: true,
	default: () => new SetRTX(),
	toJson: (set) => set.toJSON(),
	fromJson: (json) => SetRTX.fromJSON(json),
})

export const itemKeyProxies = join({
	key: `itemKeyProxies`,
	between: [`itemPerspective`, `proxy`],
	cardinality: `1:1`,
	isAType: isItemPerspectiveKey,
	isBType: isItemKeyProxy,
})

export const itemDurabilityAtoms = atomFamily<number, ItemKey<Actual>>({
	key: `itemDurability`,
	default: 0,
})

export const itemDurabilityMasks = selectorFamily<
	number | `???`,
	ItemKey<Proxy>
>({
	key: `itemDurabilityMask`,
	get:
		(itemKeyProxy) =>
		({ get }) => {
			const itemPerspectiveKey = get(
				findRelations(itemKeyProxies, itemKeyProxy).itemPerspectiveKeyOfProxy,
			)
			if (itemPerspectiveKey === null) {
				return `???`
			}
			const [, itemKeyActual] = decomposeCompoundKey(itemPerspectiveKey)

			const itemVisibilityCondition = get(
				itemVisibilityConditionSelectors,
				itemPerspectiveKey,
			)
			switch (itemVisibilityCondition) {
				case `secret`:
					return `???`
				case `masked`:
					return get(itemDurabilityAtoms, itemKeyActual)
			}
		},
})
