import type {
	Compound,
	CompoundTypedKey,
	MutableAtomToken,
	ReadonlySelectorFamilyToken,
	SelectorFamilyToken,
} from "atom.io"
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
	TransactionRequest,
	TransactionResponse,
} from "../../realtime-server/src/continuity"
import type { UserKey } from "../../realtime-server/src/realtime-server-stores/server-user-store"

// CLEAN ////////////////////////////////////////////////////////////////////////

export type Actual<S extends string = string> = `__${S}__`
export type Alias<S extends string = string> = `$$${S}$$`

export function extractAliasKey(key: `${string}::${Alias}`): Alias {
	return key.split(`::`).pop() as Alias
}
export function extractActualKey(key: `${string}::${Actual}`): Actual {
	return key.split(`::`).pop() as Actual
}

export type PerspectiveKey = CompoundTypedKey<`perspective`, Actual, UserKey>

export const VISIBILITY_CONDITIONS = [
	`secret`, // key cannot be emitted; data cannot be emitted
	`masked`, // key is spoofed; data can be masked
] as const
export type VisibilityCondition = (typeof VISIBILITY_CONDITIONS)[number]

export type TransactionResponseActual = TransactionResponse & { alias?: false }
export type TransactionResponseAlias = TransactionResponse & { alias?: true }
export type TransactionRequestAlias = TransactionRequest & { alias?: true }
export type TransactionRequestActual = TransactionRequest & { alias?: false }

export function isAliasKey(key: unknown): key is Alias {
	return typeof key === `string` && key.startsWith(`$$`) && key.endsWith(`$$`)
}
export function isPerspectiveKey(key: unknown): key is PerspectiveKey {
	return typeof key === `string` && key.startsWith(`T$--perspective==__`)
}

export const perspectiveAliases = join({
	key: `perspectiveAliases`,
	between: [`perspective`, `alias`],
	cardinality: `1:1`,
	isAType: isPerspectiveKey,
	isBType: isAliasKey,
})

export function derefTransactionRequest(
	userKey: UserKey,
	request: stringified<TransactionRequestAlias>,
): Error | stringified<TransactionRequestActual> {
	const segments = request.split(`$$`)
	let sub = false

	for (let i = 0; i < segments.length; i++) {
		const segment = segments[i]
		if (sub) {
			const aliasItemKey = `$$${segment}$$` satisfies Alias
			const perspectiveKey = getState(
				findRelations(perspectiveAliases, aliasItemKey).perspectiveKeyOfAlias,
			)
			if (perspectiveKey === null) {
				return new Error(
					`Attempted to dereference a transaction request with a alias reference that does not exist: "${segment}".`,
				)
			}
			const [, actualKey, ownerKey] = decomposeCompoundKey(perspectiveKey)
			if (ownerKey !== userKey) {
				return new Error(
					`Attempted to dereference a transaction request with a alias reference from a different user.`,
				)
			}
			segments[i] = actualKey
		}
		sub = !sub
	}
	return segments.join(``)
}

export type ViewOptions<K extends string> = {
	key: K
	selectors: SelectorFamilyToken<
		VisibilityCondition,
		Compound<`view`, `${K}::${Actual}`, UserKey>
	>
}

export function view<KT extends string>({
	key,
	selectors: visibilitySelectors,
}: ViewOptions<KT>): {
	readonly globalIndex: MutableAtomToken<
		SetRTX<`${KT}::${Actual}`>,
		SetRTXJson<`${KT}::${Actual}`>,
		UserKey
	>
	readonly perspectiveIndices: ReadonlySelectorFamilyToken<
		`${KT}::${Alias}`[],
		UserKey
	>
} {
	const globalIndex = atom<
		SetRTX<`${KT}::${Actual}`>,
		SetRTXJson<`${KT}::${Actual}`>
	>({
		key: `${key}GlobalIndex`,
		mutable: true,
		default: () => new SetRTX(),
		toJson: (set) => set.toJSON(),
		fromJson: (json) => SetRTX.fromJSON(json),
	})
	const perspectiveIndices = selectorFamily<`${KT}::${Alias}`[], UserKey>({
		key: `${key}Perspective`,
		get:
			(userKey) =>
			({ get }) => {
				const typedActualKeys = get(globalIndex)
				const aliasKeys: `${KT}::${Alias}`[] = []
				for (const actualTypedKey of typedActualKeys) {
					const actualKey = extractActualKey(actualTypedKey)
					const visibility = get(
						visibilitySelectors,
						`T$--view==${actualTypedKey}++${userKey}`,
					)
					switch (visibility) {
						case `secret`:
							break
						case `masked`:
							{
								const perspectiveKey: PerspectiveKey = `T$--perspective==${actualKey}++${userKey}`
								let aliasKey: Alias
								const aliasKeyState = findRelations(
									perspectiveAliases,
									perspectiveKey,
								).aliasKeyOfPerspective
								const maybeAliasKey = get(aliasKeyState)
								if (maybeAliasKey) {
									aliasKey = maybeAliasKey
								} else {
									aliasKey = `$$${crypto.randomUUID()}$$`
									editRelations(perspectiveAliases, (relations) =>
										relations.set({
											perspective: perspectiveKey,
											alias: aliasKey,
										}),
									)
								}
								aliasKeys.push(`${key}::${aliasKey}`)
							}
							break
					}
				}
				return aliasKeys
			},
	})
	return {
		globalIndex,
		perspectiveIndices,
	}
}

// MIXED ////////////////////////////////////////////////////////////////////////

export const itemDurabilityMasks = selectorFamily<
	number | `???`,
	ItemKey<Alias>
>({
	key: `itemDurabilityMask`,
	get:
		(itemKeyAlias) =>
		({ get }) => {
			const aliasKey = extractAliasKey(itemKeyAlias)
			const perspectiveKey = get(
				findRelations(perspectiveAliases, aliasKey).perspectiveKeyOfAlias,
			)
			if (perspectiveKey === null) {
				return `???`
			}
			const [, actualKey, userKey] = decomposeCompoundKey(perspectiveKey)
			const actualItemKey = `item::__${actualKey}__` satisfies ItemKey<Actual>

			const itemVisibilityCondition = get(
				itemVisibilitySelectors,
				`T$--view==${actualItemKey}++${userKey}`,
			)
			switch (itemVisibilityCondition) {
				case `secret`:
					return `???`
				case `masked`:
					return get(itemDurabilityAtoms, actualItemKey)
			}
		},
})

// export function mask<KT extends string>(
// 	states: AtomFamilyToken<any, `KT::${Actual}`>,
// ): WritableSelectorFamilyToken<any, `KT::${Alias}`> {

// }

// DIRTY ////////////////////////////////////////////////////////////////////////

export type UnitKey<K extends Actual | Alias = Actual | Alias> = `unit::${K}`
export type UnitViewKey = Compound<`view`, UnitKey<Actual>, UserKey>

export type ItemKey<K extends Actual | Alias = Actual | Alias> = `item::${K}`
export type ItemViewKey = CompoundTypedKey<`view`, ItemKey<Actual>, UserKey>

export const itemVisibilitySelectors = selectorFamily<
	VisibilityCondition,
	ItemViewKey
>({
	key: `itemVisibility`,
	get: (_) => (__) => {
		return `masked`
	},
})

export const {
	globalIndex: itemGlobalIndex,
	perspectiveIndices: itemPerspectiveIndices,
} = view({
	key: `item`,
	selectors: itemVisibilitySelectors,
})

export const itemDurabilityAtoms = atomFamily<number, ItemKey<Actual>>({
	key: `itemDurability`,
	default: 0,
})
