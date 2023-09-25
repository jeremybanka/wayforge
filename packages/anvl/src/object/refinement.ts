import { pipe } from "../function"
import type { Refinement } from "../refinement"

import { allTrue, every } from "../array"
import { pass } from "../function"
import { ifNullish } from "../nullish"
import { access } from "./access"
import { recordToEntries } from "./entries"
import { mob } from "./mapObject"

export type PlainObject = Record<keyof any, unknown>
export type EmptyObject = Record<keyof any, never>

export const isNonNullObject = (input: unknown): input is object =>
	typeof input === `object` && input !== null

export const isPlainObject = (input: unknown): input is PlainObject =>
	isNonNullObject(input) && Object.getPrototypeOf(input) === Object.prototype

export const isEmptyObject = (input: unknown): input is EmptyObject =>
	isPlainObject(input) && Object.keys(input).length === 0

export const isRecord =
	<KEY extends keyof any, VAL>(
		isKey: Refinement<keyof any, KEY>,
		isValue: Refinement<unknown, VAL>,
	) =>
	(input: unknown): input is Record<KEY, VAL> =>
		isPlainObject(input) &&
		Object.entries(input).every(([k, v]) => isKey(k) && isValue(v))

export type HasPropertiesOptions = {
	readonly allowExtraProperties?: boolean
}
export const hasProperties = <OBJ extends object>(
	isValue: {
		[K in keyof OBJ]: Refinement<unknown, OBJ[K]>
	},
	options: HasPropertiesOptions = { allowExtraProperties: false },
): Refinement<unknown, OBJ> => {
	const name = `{${recordToEntries(
		isValue as Record<keyof any, Refinement<any, any>>,
	)
		.map(([k, v]) => String(k) + `:` + v.name)
		.join(`,`)}}`

	const _ = {
		[name]: (input: unknown): input is OBJ =>
			isPlainObject(input) &&
			pipe(
				isValue,
				Object.entries,
				every(([key, val]) => key in input || val(undefined)),
			) &&
			pipe(
				input,
				mob((val, key) =>
					pipe(
						isValue,
						access(key),
						ifNullish(() => options.allowExtraProperties),
						pass(val),
					),
				),
				Object.values,
				allTrue,
			),
	}
	return _[name]
}

export const ALLOW_EXTENSION = { allowExtraProperties: true }
export const doesExtend = <OBJ extends object>(
	isValue: {
		[K in keyof OBJ]: Refinement<unknown, OBJ[K]>
	},
): Refinement<unknown, OBJ> => hasProperties(isValue, ALLOW_EXTENSION)

export const DO_NOT_ALLOW_EXTENSION = { allowExtraProperties: false }
export const hasExactProperties = <OBJ extends object>(
	isValue: {
		[K in keyof OBJ]: Refinement<unknown, OBJ[K]>
	},
): Refinement<unknown, OBJ> => hasProperties(isValue, DO_NOT_ALLOW_EXTENSION)
