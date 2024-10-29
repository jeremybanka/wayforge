import type { CompoundTypedKey, TransactionUpdate } from "atom.io"
import {
	atom,
	atomFamily,
	decomposeCompoundKey,
	getState,
	selectorFamily,
} from "atom.io"
import { editRelations, findRelations, join } from "atom.io/data"
import type { JsonIO, stringified } from "atom.io/json"
import type { SetRTXJson } from "atom.io/transceivers/set-rtx"
import { SetRTX } from "atom.io/transceivers/set-rtx"

import type {
	JsonTxUpdate,
	TransactionRequest,
} from "../continuity/prepare-to-serve-transaction-request"
import type { UserKey } from "./server-user-store"

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
			const segment = segments[i] as ItemKey<Proxy>
			const itemPerspectiveKey = getState(
				findRelations(itemKeyProxies, segment).itemPerspectiveKeyOfProxy,
			)
			if (itemPerspectiveKey === null) {
				return new Error(
					`Attempted to dereference a transaction request with a proxy reference that does not exist.`,
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
	const actualUpdate = {
		...update,
		proxy: true,
		updates: update.updates.map((subUpdate) => {
			if (subUpdate.type === `atom_update` && subUpdate.key.includes(`__`)) {
				const segments = subUpdate.key.split(`$$`)
			}
		}),
	} satisfies TransactionUpdateProxy
	return actualUpdate
}

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
