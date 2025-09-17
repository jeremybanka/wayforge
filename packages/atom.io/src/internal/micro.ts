import type { primitive } from "atom.io/json"

import type { Flat } from "./utility-types"

export type IndexOf<
	T extends readonly unknown[],
	E,
	A extends unknown[] = [],
> = T extends readonly [infer Head, ...infer Tail]
	? (<U>() => U extends Head ? 1 : 2) extends <U>() => U extends E ? 1 : 2
		? A[`length`]
		: IndexOf<Tail, E, [...A, unknown]>
	: never

export type Flip<T extends Record<string, number | string>> = {
	[K in keyof T as T[K]]: K
}

export type TwoWay<T extends Record<string, number | string>> = Flip<T> & T

export type Enumeration<T extends readonly string[]> = Flat<
	TwoWay<{
		[K in T[number]]: IndexOf<T, K>
	}>
>

export function enumeration<T extends readonly string[]>(
	values: T,
): Enumeration<T> {
	const result: Record<any, any> = {}
	let i = 0
	for (const value of values) {
		result[value] = i
		result[i] = value
		++i
	}
	return result as Enumeration<T>
}

const BOOL = `\u0001`
const NULL = `\u0002`
const STRING = `\u0003`
const NUMBER = `\u0004`
export const packValue = (value: primitive): string => {
	const type = typeof value as `boolean` | `number` | `object` | `string`
	switch (type) {
		case `string`:
			return STRING + value
		case `number`:
			return NUMBER + value
		case `boolean`:
			return BOOL + +(value as boolean)
		case `object`:
			return NULL
	}
}
export const unpackValue = (value: string): primitive => {
	const type = value[0] as `\u0001` | `\u0002` | `\u0003` | `\u0004`
	switch (type) {
		case STRING:
			return value.slice(1)
		case NUMBER:
			return +value.slice(1)
		case BOOL:
			return value.slice(1) === `1`
		case NULL:
			return null
	}
}
