import type { Flat } from "atom.io/internal"
import type { Canonical } from "atom.io/json"

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
export const packValue = (value: Canonical): string => {
	if (value === null) return NULL
	// eslint-disable-next-line @typescript-eslint/switch-exhaustiveness-check
	switch (typeof value) {
		case `string`:
			return STRING + value
		case `number`:
			return NUMBER + value
		case `boolean`:
			return BOOL + +value
		case `object`: // array
			return JSON.stringify(value)
	}
}
export const unpackValue = (value: string): Canonical => {
	const type = value[0] as `[` | `\u0001` | `\u0002` | `\u0003` | `\u0004`

	switch (type) {
		case STRING:
			return value.slice(1)
		case NUMBER:
			return +value.slice(1)
		case BOOL:
			return value.slice(1) === `1`
		case NULL:
			return null
		case `[`:
			return JSON.parse(value)
	}
}
