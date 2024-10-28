import {
	atom,
	atomFamily,
	type CompoundTypedKey,
	decomposeCompoundKey,
	getState,
	selectorFamily,
} from "atom.io"
import {
	editRelations,
	editRelationsInStore,
	findRelations,
	join,
} from "atom.io/data"
import type { SetRTXJson } from "atom.io/transceivers/set-rtx"
import { SetRTX } from "atom.io/transceivers/set-rtx"

import type { UserKey } from "./server-user-store"

export const VISIBILITY_CONDITIONS = [
	`secret`, // key cannot be emitted; data cannot be emitted
	`masked`, // key is spoofed; data can be masked
] as const
export type VisibilityCondition = (typeof VISIBILITY_CONDITIONS)[number]

export type ItemKey = `item::${string}`
export function isItemKey(key: unknown): key is ItemKey {
	return typeof key === `string` && key.startsWith(`item::`)
}
export type Spoofed<T extends string> = T & { spoofed: true }
export function isSpoofedItemKey(key: unknown): key is Spoofed<ItemKey> {
	return (
		isItemKey(key) &&
		getState(findRelations(itemKeySpoofs, key).itemPerspectiveKeyOfSpoofed) !==
			null
	)
}
export type ItemPerspectiveKey = CompoundTypedKey<`perspective`, `item`, `user`>
export function isItemPerspectiveKey(key: unknown): key is ItemPerspectiveKey {
	return typeof key === `string` && key.startsWith(`T$--perspective==item::`)
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

export const itemGlobalIndex = atom<SetRTX<ItemKey>, SetRTXJson<ItemKey>>({
	key: `itemGlobalIndex`,
	mutable: true,
	default: () => new SetRTX(),
	toJson: (set) => set.toJSON(),
	fromJson: (json) => SetRTX.fromJSON(json),
})

export const itemKeySpoofs = join({
	key: `itemKeySpoofs`,
	between: [`itemPerspective`, `spoofed`],
	cardinality: `1:1`,
	isAType: isItemPerspectiveKey,
	isBType: isItemKey,
})

export const itemPerspectiveIndices = selectorFamily<ItemKey[], UserKey>({
	key: `itemPerspectiveIndices`,
	get:
		(userKey) =>
		({ get }) => {
			const allItemKeys = get(itemGlobalIndex)
			const visibleItemKeys: ItemKey[] = []
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
							let spoofedKey: ItemKey
							const maybeSpoofedKey = get(
								findRelations(itemKeySpoofs, itemPerspectiveKey)
									.spoofedKeyOfItemPerspective,
							)
							if (maybeSpoofedKey) {
								spoofedKey = maybeSpoofedKey
							} else {
								spoofedKey = `item::${crypto.randomUUID()}`
								editRelations(itemKeySpoofs, (relations) => {
									relations.set({
										itemPerspective: itemPerspectiveKey,
										spoofed: spoofedKey,
									})
								})
							}
							visibleItemKeys.push(spoofedKey)
						}
						break
				}
			}
			return visibleItemKeys
		},
})

export const itemDurabilityAtoms = atomFamily<number, ItemKey>({
	key: `itemDurability`,
	default: 0,
})

export const itemDurabilityMasks = selectorFamily<number | `???`, ItemKey>({
	key: `itemDurability`,
	get:
		(itemKey) =>
		({ get }) => {
			const itemPerspectiveKey = get(
				findRelations(itemKeySpoofs, itemKey).itemPerspectiveKeyOfSpoofed,
			)
			if (itemPerspectiveKey === null) {
				return `???`
			}
			const [, singularB, singularC] = decomposeCompoundKey(itemPerspectiveKey)
		},
})
