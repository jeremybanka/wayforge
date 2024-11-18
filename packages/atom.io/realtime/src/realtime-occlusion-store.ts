import type {
	Compound,
	MutableAtomToken,
	Original,
	ReadonlySelectorFamilyToken,
	SelectorFamilyToken,
	Tag,
} from "atom.io"
import { atom, decomposeCompoundKey, selectorFamily } from "atom.io"
import { editRelationsInStore, findRelationsInStore, join } from "atom.io/data"
import type { Store } from "atom.io/internal"
import { getFromStore } from "atom.io/internal"
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

export function extractAliasKeys<K extends AnyAliasKey>(
	key: K,
): [Alias[], (actuals: Actual[]) => ToActual<K>] {
	const aliases: Alias[] = []
	const segments: (string | null)[] = key.split(`$$`)
	for (let i = 0, sub = false; i < segments.length; i++, sub = !sub) {
		const segment = segments[i]
		if (sub) {
			aliases.push(`$$${segment}$$`)
			segments[i] = null
		}
	}
	return [
		aliases,
		(actuals) => {
			for (let i = 0; i < segments.length; i++) {
				if (segments[i] === null) {
					// biome-ignore lint/style/noNonNullAssertion: safe in this context
					segments[i] = actuals.shift()!
				}
			}
			return segments.join(``) as any
		},
	]
}
export function extractActualKeys<K extends AnyActualKey>(
	key: K,
): [Actual[], (aliases: Alias[]) => ToAlias<K>] {
	const actuals: Actual[] = []
	const segments: (string | null)[] = key.split(`__`)
	let sub = false
	for (let i = 0; i < segments.length; i++, sub = !sub) {
		if (sub) {
			const segment = segments[i]
			actuals.push(`__${segment}__`)
			segments[i] = null
		}
	}
	return [
		actuals,
		(aliases) => {
			for (let i = 0; i < segments.length; i++) {
				if (segments[i] === null) {
					// biome-ignore lint/style/noNonNullAssertion: safe in this context
					segments[i] = aliases.shift()!
				}
			}
			return segments.join(``) as any
		},
	]
}

export type PerspectiveKey = Compound<
	Tag<`perspective`>,
	Actual,
	UserKey<Actual>
>

export const VISIBILITY_CONDITIONS = [
	`secret`, // key cannot be emitted; data cannot be emitted
	`masked`, // key is spoofed; data can be masked
] as const
export type VisibilityCondition = (typeof VISIBILITY_CONDITIONS)[number]

export type TransactionResponseActual = TransactionResponse & { alias?: false }
export type TransactionResponseAlias = TransactionResponse & { alias?: true }
export type TransactionRequestAlias = TransactionRequest & { alias?: true }
export type TransactionRequestActual = TransactionRequest & { alias?: false }

export function isAlias(key: unknown): key is Alias {
	return typeof key === `string` && key.startsWith(`$$`) && key.endsWith(`$$`)
}
export function isPerspectiveKey(key: unknown): key is PerspectiveKey {
	return (
		typeof key === `string` &&
		key.startsWith(`T$--perspective==__`) &&
		key.endsWith(`__`)
	)
}

export const perspectiveAliases = join({
	key: `perspectiveAliases`,
	between: [`perspective`, `alias`],
	cardinality: `1:1`,
	isAType: isPerspectiveKey,
	isBType: isAlias,
})

export type Aliased<T> = T & { alias?: true }
export type True<T> = T & { alias?: false }

export function derefAliases(
	store: Store,
	userKey: UserKey,
	request: string,
): Error | string {
	const segments = request.split(`$$`)
	let sub = false

	for (let i = 0; i < segments.length; i++) {
		const segment = segments[i]
		if (sub) {
			const aliasItemKey = `$$${segment}$$` satisfies Alias
			const perspectiveKey = getFromStore(
				store,
				findRelationsInStore(perspectiveAliases, aliasItemKey, store)
					.perspectiveKeyOfAlias,
			)
			if (perspectiveKey === null) {
				return new Error(
					`Attempted to dereference a string with a alias reference that does not exist: "${segment}".`,
				)
			}
			const [, actualKey, ownerKey] = decomposeCompoundKey(perspectiveKey)
			if (ownerKey !== userKey) {
				return new Error(
					`Attempted to dereference a string for ${userKey} with a alias reference from ${ownerKey}.`,
				)
			}
			segments[i] = actualKey
		}
		sub = !sub
	}
	return segments.join(``) as any
}
export function derefTransactionRequest(
	store: Store,
	userKey: UserKey,
	request: stringified<TransactionRequestAlias>,
): Error | stringified<TransactionRequestActual> {
	return derefAliases(store, userKey, request)
}

// let a: AnyTypedKeyWithActuals
// const b: UserKey<Actual> = `user::__jane-1__`
// const c: Compound<Tag<`haha`>, UserKey<Actual>, UserKey> = `user::__jane-1__`
// a = b
// a = c

// type Y = ToAlias<UserKey<Actual>>
// type Z = ToAlias<Compound<Tag<`haha`>, UserKey<Actual>, UserKey<Actual>>>

export type AnyActualKey = `${string}__${string}__${string}`

export type AnyAliasKey = `${string}$$${string}$$${string}`

export type ToActual<K extends AnyAliasKey> = K extends Compound<
	infer X,
	infer A,
	infer B
>
	? A extends AnyAliasKey
		? B extends AnyAliasKey
			? Compound<X, ToActual<A>, ToActual<B>>
			: Compound<X, ToActual<A>, B>
		: B extends AnyAliasKey
			? Compound<X, A, ToActual<B>>
			: Compound<X, A, B>
	: K extends Original<infer X, Alias<infer A>>
		? Original<X, Actual<A>>
		: AnyActualKey
export type ToAlias<K extends AnyActualKey> = K extends Compound<
	infer X,
	infer A,
	infer B
>
	? A extends AnyActualKey
		? B extends AnyActualKey
			? Compound<X, ToAlias<A>, ToAlias<B>>
			: Compound<X, ToAlias<A>, B>
		: B extends AnyActualKey
			? Compound<X, A, ToAlias<B>>
			: Compound<X, A, B>
	: K extends Original<infer X, Actual<infer A>>
		? Original<X, Alias<A>>
		: AnyAliasKey

export const holdsActuals = (k: string): k is AnyActualKey => k.includes(`__`)
export const holdsAliases = (k: string): k is AnyAliasKey => k.includes(`$$`)

export type UnwrapAlias<K extends AnyAliasKey> = K extends Original<
	string,
	Alias<infer A>
>
	? A
	: never

export type ViewOptions<K extends AnyActualKey> = {
	key: string
	selectors: SelectorFamilyToken<
		VisibilityCondition,
		Compound<Tag<`view`>, UserKey<Actual>, K>
	>
}

export function view<K extends AnyActualKey>({
	key,
	selectors: visibilitySelectors,
}: ViewOptions<K>): {
	readonly globalIndex: MutableAtomToken<SetRTX<K>, SetRTXJson<K>>
	readonly perspectiveIndices: ReadonlySelectorFamilyToken<
		[actual: K, alias: ToAlias<K>][],
		UserKey<Actual>
	>
} {
	const globalIndex = atom<SetRTX<K>, SetRTXJson<K>>({
		key: `${key}GlobalIndex`,
		mutable: true,
		default: () => new SetRTX(),
		toJson: (set) => set.toJSON(),
		fromJson: (json) => SetRTX.fromJSON(json),
	})
	const perspectiveIndices = selectorFamily<
		[actual: K, alias: ToAlias<K>][],
		UserKey<Actual>
	>({
		key: `${key}Perspective`,
		get:
			(userKey) =>
			({ env, find, get }) => {
				const { store } = env()
				const typedActualKeys = get(globalIndex)
				const aliasKeys: [actual: K, alias: ToAlias<K>][] = []
				for (const actualTypedKey of typedActualKeys) {
					const [actuals, compileAliasKey] = extractActualKeys(actualTypedKey)
					const visibility = get(
						find(visibilitySelectors, `T$--view==${userKey}++${actualTypedKey}`),
					)
					switch (visibility) {
						case `secret`:
							break
						case `masked`:
							{
								const aliases: Alias[] = []
								for (const actual of actuals) {
									const perspectiveKey: PerspectiveKey = `T$--perspective==${actual}++${userKey}`
									const aliasKeyState = findRelationsInStore(
										perspectiveAliases,
										perspectiveKey,
										store,
									).aliasKeyOfPerspective
									const maybeAlias = get(aliasKeyState)
									let alias: Alias
									if (maybeAlias) {
										alias = maybeAlias
									} else {
										alias = `$$${Math.random().toString(36).slice(2, 10)}$$`
										editRelationsInStore(
											perspectiveAliases,
											(relations) =>
												relations.set({
													perspective: perspectiveKey,
													alias: alias,
												}),
											store,
										)
									}
									aliases.push(alias)
								}
								const aliasKey = compileAliasKey(aliases)
								aliasKeys.push([actualTypedKey, aliasKey])
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

// export function mask<KT extends string>(
// 	states: AtomFamilyToken<any, `KT::${Actual}`>,
// ): WritableSelectorFamilyToken<any, `KT::${Alias}`> {

// }

// DIRTY ////////////////////////////////////////////////////////////////////////

const example = () => {
	type UnitKey<K extends Actual | Alias = Actual | Alias> = `unit::${K}`
	type UnitViewKey = Compound<Tag<`view`>, UnitKey<Actual>, UserKey<Alias>>

	type ItemKey<K extends Actual | Alias = Actual | Alias> = `item::${K}`
	type ItemViewKey = Compound<Tag<`view`>, ItemKey<Actual>, UserKey<Alias>>

	const itemVisibilitySelectors = selectorFamily<
		VisibilityCondition,
		ItemViewKey
	>({
		key: `itemVisibility`,
		get: (_) => (__) => {
			return `masked`
		},
	})

	// 	const {
	// 		globalIndex: itemGlobalIndex,
	// 		perspectiveIndices: itemPerspectiveIndices,
	// 	} = view({
	// 		key: `item`,
	// 		selectors: itemVisibilitySelectors,
	// 	})

	// 	const itemDurabilityAtoms = atomFamily<number, ItemKey<Actual>>({
	// 		key: `itemDurability`,
	// 		default: 0,
	// 	})

	// 	const itemDurabilityMasks = selectorFamily<number | `???`, ItemKey<Alias>>({
	// 		key: `itemDurabilityMask`,
	// 		get:
	// 			(itemKeyAlias) =>
	// 			({ get }) => {
	// 				const aliasKey = extractAliasKeys(itemKeyAlias)
	// 				const perspectiveKey = get(
	// 					findRelations(perspectiveAliases, aliasKey).perspectiveKeyOfAlias,
	// 				)
	// 				if (perspectiveKey === null) {
	// 					return `???`
	// 				}
	// 				const [, actualKey, userKey] = decomposeCompoundKey(perspectiveKey)
	// 				const actualItemKey = `item::__${actualKey}__` satisfies ItemKey<Actual>

	// 				const itemVisibilityCondition = get(
	// 					itemVisibilitySelectors,
	// 					`T$--view==${actualItemKey}++${userKey}`,
	// 				)
	// 				switch (itemVisibilityCondition) {
	// 					case `secret`:
	// 						return `???`
	// 					case `masked`:
	// 						return get(itemDurabilityAtoms, actualItemKey)
	// 				}
	// 			},
	// 	})
}
