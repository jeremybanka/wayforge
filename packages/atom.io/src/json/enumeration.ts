import type { Flat } from "atom.io/internal"

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
