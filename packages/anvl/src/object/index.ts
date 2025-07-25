import { filter, includesAny, reduce } from "../array"
import { pipe } from "../function"
import { isUndefined } from "../nullish"
import type { Refinement } from "../refinement"
import { deepMob } from "./deepMob"
import { entriesToRecord, recordToEntries } from "./entries"
import { isPlainObject } from "./refinement"

export * from "./access"
export * from "./deepMob"
export * from "./dictionary"
export * from "./entries"
export * from "./mapObject"
export * from "./modify"
export * from "./patch"
export * from "./refinement"

export const redact =
	<K extends PropertyKey>(...args: K[]) =>
	<O extends Record<K, any>>(obj: O): Omit<O, K> =>
		// eslint-disable-next-line @typescript-eslint/no-dynamic-delete
		reduce<K, O>((acc, key) => (delete acc[key], acc), obj)(args)

export type Redacted<Holder, RedactProp extends PropertyKey> = Omit<
	{
		[K in keyof Holder]: Holder[K] extends (infer Item)[]
			? Redacted<Item, RedactProp>[]
			: Redacted<Omit<Holder[K], RedactProp>, RedactProp>
	},
	RedactProp
>
export const redactDeep =
	<K extends PropertyKey>(...args: K[]) =>
	<O extends Record<K, any>>(base: O): Redacted<O, K> =>
		deepMob(base, (node, path) =>
			includesAny(args)(path)
				? {
						meta: { pathComplete: true },
					}
				: {
						data: isPlainObject(node)
							? redact(...args)(node as Record<PropertyKey, any>)
							: node,
					},
		)

export const select =
	<Key extends PropertyKey>(...args: Key[]) =>
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
	(shouldDiscard: (val: unknown, key: PropertyKey) => boolean = isUndefined) =>
	<T extends object>(
		obj: T,
	): T extends Record<PropertyKey, unknown> ? T : Partial<T> => {
		const newObj = {} as T
		const entries = Object.entries(obj) as [keyof T, any][]
		for (const [key, val] of entries) {
			if (!shouldDiscard(val, key)) {
				newObj[key] = val
			}
		}
		return newObj as T extends Record<PropertyKey, unknown> ? T : Partial<T>
	}

export type KeysExtending<T, V> = keyof {
	[K in keyof T]: T[K] extends V ? K : never
}

export const filterProperties =
	<DiscardVal, DiscardKey extends PropertyKey>(
		shouldDiscardVal: Refinement<unknown, DiscardVal>,
		shouldDiscardKey: Refinement<unknown, DiscardKey>,
	) =>
	<P extends Record<PropertyKey, any>>(
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
	obj: Record<PropertyKey, any>,
	path: ReadonlyArray<PropertyKey>,
): Error | { found: unknown } => {
	const found = path.reduce((acc, key) => acc?.[key], obj)
	return found === undefined ? new Error(`Not found`) : { found }
}

export const tweak = (
	obj: Record<PropertyKey, any>,
	path: ReadonlyArray<PropertyKey>,
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
