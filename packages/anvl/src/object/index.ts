import type { Refinement } from "fp-ts/Refinement"
import { pipe } from "fp-ts/function"

import { filter, includesAny, reduce } from "../array"
import { isUndefined } from "../nullish"
import { deepMob } from "./deepMob"
import { entriesToRecord, recordToEntries } from "./entries"
import { isPlainObject } from "./refinement"

export * from "./access"
export * from "./deepMob"
export * from "./entries"
export * from "./mapObject"
export * from "./modify"
export * from "./patch"
export * from "./refinement"
export * from "./sprawl"

export const redact =
	<K extends keyof any>(...args: K[]) =>
	<O extends Record<K, any>>(obj: O): Omit<O, K> =>
		reduce<K, O>((acc, key) => (delete acc[key], acc), obj)(args)

export type Redacted<Holder, RedactProp extends keyof any> = Omit<
	{
		[K in keyof Holder]: Holder[K] extends (infer Item)[]
			? Redacted<Item, RedactProp>[]
			: Redacted<Omit<Holder[K], RedactProp>, RedactProp>
	},
	RedactProp
>
export const redactDeep =
	<K extends keyof any>(...args: K[]) =>
	<O extends Record<K, any>>(base: O): Redacted<O, K> =>
		deepMob(base, (node, path) =>
			includesAny(args)(path)
				? {
						meta: { pathComplete: true },
				  }
				: {
						data: isPlainObject(node)
							? redact(...args)(node as Record<keyof any, any>)
							: node,
				  },
		)

export const select =
	<Key extends keyof any>(...args: Key[]) =>
	<Obj extends object>(
		obj: Obj,
	): {
		// @ts-expect-error fuk u
		[K in keyof Pick<Obj, Key>]: any extends Pick<Obj, Key>[K]
			? undefined
			: // @ts-expect-error fuk u
			  Pick<Obj, Key>[K]
	} =>
		// @ts-expect-error fuk u ts
		reduce<Key, Pick<Obj, Key>>(
			// @ts-expect-error i will fite u
			(acc, key) => (key in obj ? (acc[key] = obj[key as keyof Obj]) : acc, acc),
			// @ts-expect-error fuk u
			{} as Pick<Obj, Key>,
		)(args)

export const treeShake =
	(shouldDiscard: (val: unknown, key: keyof any) => boolean = isUndefined) =>
	<T extends object>(
		obj: T,
	): T extends Record<keyof any, unknown> ? T : Partial<T> => {
		const newObj = {} as T
		const entries = Object.entries(obj) as [keyof T, any][]
		entries.forEach(([key, val]) =>
			!shouldDiscard(val, key) ? (newObj[key] = val) : null,
		)
		return newObj as T extends Record<keyof any, unknown> ? T : Partial<T>
	}

export type KeysExtending<T, V> = keyof {
	[K in keyof T]: T[K] extends V ? K : never
}

const a: never | null = null

export const filterProperties =
	<DiscardVal, DiscardKey extends keyof any>(
		shouldDiscardVal: Refinement<unknown, DiscardVal>,
		shouldDiscardKey: Refinement<unknown, DiscardKey>,
	) =>
	<P extends Record<keyof any, any>>(
		props: P,
	): DiscardVal extends never
		? DiscardKey extends never
			? P
			: Omit<P, DiscardKey>
		: Omit<P, DiscardKey | KeysExtending<P, DiscardVal>> =>
		// @ts-expect-error oh well
		pipe(
			props,
			recordToEntries,
			filter(
				(
					entry,
				): entry is [
					Exclude<keyof P, DiscardKey>,
					Exclude<P[keyof P], DiscardVal>,
				] => !shouldDiscardKey(entry[0]) || !shouldDiscardVal(entry[1]),
			),
			entriesToRecord,
		)

export const delve = (
	obj: Record<keyof any, any>,
	path: ReadonlyArray<keyof any>,
): Error | { found: unknown } => {
	const found = path.reduce((acc, key) => acc?.[key], obj)
	return found === undefined ? new Error(`Not found`) : { found }
}

export const tweak = (
	obj: Record<keyof any, any>,
	path: ReadonlyArray<keyof any>,
	value: unknown,
): void =>
	path.reduce((acc, key, i) => {
		if (i === path.length - 1) {
			acc[key] = value
		}
		if (acc[key] === undefined) {
			acc[key] = typeof key === `number` ? [] : {}
		}
		return acc[key]
	}, obj)

export type RequireAtLeastOne<T> = {
	[K in keyof T]-?: Partial<Pick<T, Exclude<keyof T, K>>> & Required<Pick<T, K>>
}[keyof T]

export type RequireExactlyOne<T> = {
	[K in keyof T]-?: Required<Pick<T, K>>
}[keyof T]
