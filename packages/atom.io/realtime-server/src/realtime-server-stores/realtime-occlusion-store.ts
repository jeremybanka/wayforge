import type {
	Compound,
	CompoundTypedKey,
	MutableAtomFamilyToken,
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
	JsonTxUpdate,
	TransactionRequest,
} from "../continuity/prepare-to-serve-transaction-request"
import type { UserKey } from "./server-user-store"

// CLEAN ////////////////////////////////////////////////////////////////////////

export type Actual = `__${string}__`
export type Proxy = `$$${string}$$`

export function extractProxyKey(key: `${string}::${Proxy}`): Proxy {
	return key.split(`::`).pop() as Proxy
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

export type TransactionUpdateActual = JsonTxUpdate & { proxy?: false }
export type TransactionUpdateProxy = JsonTxUpdate & { proxy?: true }
export type TransactionRequestProxy = TransactionRequest & { proxy?: true }
export type TransactionRequestActual = TransactionRequest & { proxy?: false }

export function isProxyKey(key: unknown): key is Proxy {
	return typeof key === `string` && key.startsWith(`$$`) && key.endsWith(`$$`)
}
export function isPerspectiveKey(key: unknown): key is PerspectiveKey {
	return typeof key === `string` && key.startsWith(`T$--perspective==__`)
}

export const globalProxies = join({
	key: `globalProxy`,
	between: [`perspective`, `proxy`],
	cardinality: `1:1`,
	isAType: isPerspectiveKey,
	isBType: isProxyKey,
})

export function derefTransactionRequest(
	userKey: UserKey,
	request: stringified<TransactionRequestProxy>,
): Error | stringified<TransactionRequestActual> {
	const segments = request.split(`$$`)
	let sub = false
	let peekBehind: string
	for (let i = 0; i < segments.length; i++) {
		const segment = segments[i]
		if (sub) {
			const proxyItemKey = `$$${segment}$$` satisfies Proxy
			const perspectiveKey = getState(
				findRelations(globalProxies, proxyItemKey).perspectiveKeyOfProxy,
			)
			if (perspectiveKey === null) {
				return new Error(
					`Attempted to dereference a transaction request with a proxy reference that does not exist: "${segment}".`,
				)
			}
			const [, actualKey, ownerKey] = decomposeCompoundKey(perspectiveKey)
			if (ownerKey !== userKey) {
				return new Error(
					`Attempted to dereference a transaction request with a proxy reference from a different user.`,
				)
			}
			segments[i] = actualKey
		} else {
			peekBehind = segment
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
					for (const segment of segments) {
						if (sub) {
							const actualKey = `__${segment}__` satisfies Actual
							const perspectiveKey =
								`T$--perspective==${actualKey}++${userKey}` satisfies PerspectiveKey
							const proxyItemKey = getState(
								findRelations(globalProxies, perspectiveKey)
									.perspectiveKeyOfProxy,
							)
							if (proxyItemKey !== null) {
								updatesInPerspective.push({
									...subUpdate,
									key: proxyItemKey,
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

export type ViewOptions<K extends string> = {
	key: K
	selectors: SelectorFamilyToken<
		VisibilityCondition,
		Compound<`view`, `${K}::${Actual}`, UserKey>
	>
}

export function view<TK extends string>({
	key,
	selectors: visibilitySelectors,
}: ViewOptions<TK>): {
	readonly globalIndex: MutableAtomToken<
		SetRTX<`${TK}::${Actual}`>,
		SetRTXJson<`${TK}::${Actual}`>,
		UserKey
	>
	readonly perspectiveIndices: ReadonlySelectorFamilyToken<
		`${TK}::${Proxy}`[],
		UserKey
	>
} {
	const globalIndex = atom<
		SetRTX<`${TK}::${Actual}`>,
		SetRTXJson<`${TK}::${Actual}`>
	>({
		key: `${key}GlobalIndex`,
		mutable: true,
		default: () => new SetRTX(),
		toJson: (set) => set.toJSON(),
		fromJson: (json) => SetRTX.fromJSON(json),
	})
	const perspectiveIndices = selectorFamily<`${TK}::${Proxy}`[], UserKey>({
		key: `${key}Perspective`,
		get:
			(userKey) =>
			({ get }) => {
				const typedActualKeys = get(globalIndex)
				const proxyKeys: `${TK}::${Proxy}`[] = []
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
								let proxyKey: Proxy
								const proxyKeyState = findRelations(
									globalProxies,
									perspectiveKey,
								).proxyKeyOfPerspective
								const maybeProxyKey = get(proxyKeyState)
								if (maybeProxyKey) {
									proxyKey = maybeProxyKey
								} else {
									proxyKey = `$$${crypto.randomUUID()}$$`
									editRelations(globalProxies, (relations) =>
										relations.set({
											perspective: perspectiveKey,
											proxy: proxyKey,
										}),
									)
								}
								proxyKeys.push(`${key}::${proxyKey}`)
							}
							break
					}
				}
				return proxyKeys
			},
	})
	return {
		globalIndex,
		perspectiveIndices,
	}
}

// MIXED ////////////////////////////////////////////////////////////////////////

// DIRTY ////////////////////////////////////////////////////////////////////////

export type UnitKey<K extends Actual | Proxy = Actual | Proxy> = `unit::${K}`
export type UnitViewKey = Compound<`view`, UnitKey<Actual>, UserKey>

export type ItemKey<K extends Actual | Proxy = Actual | Proxy> = `item::${K}`
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

export const itemDurabilityMasks = selectorFamily<
	number | `???`,
	ItemKey<Proxy>
>({
	key: `itemDurabilityMask`,
	get:
		(itemKeyProxy) =>
		({ get }) => {
			const proxyKey = extractProxyKey(itemKeyProxy)
			const perspectiveKey = get(
				findRelations(globalProxies, proxyKey).perspectiveKeyOfProxy,
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
