export type Join<
	Arr extends any[],
	Separator extends string = `,`,
> = Arr extends []
	? ``
	: Arr extends [infer First extends string]
		? First
		: Arr extends [infer First extends string, ...infer Rest extends string[]]
			? `${First}${Separator}${Join<Rest, Separator>}`
			: string

export type Split<
	S extends string,
	D extends string = `/`,
> = S extends `${infer T extends string}${D}${infer U extends string}`
	? [T, ...Split<U, D>]
	: S extends ``
		? []
		: [S]

export type Deref<S extends string[], V extends string = `$`> = S extends [
	`${infer T extends string}`,
	...infer U extends string[],
]
	? T extends `${V}${string}`
		? [string & {}, ...Deref<U, V>]
		: [T, ...Deref<U, V>]
	: []

export type Flatten<R extends { [K in PropertyKey]: any }> = {
	[K in keyof R]: R[K]
}

/**
 * Convert a union ("|") to an intersection ("&")
 */
export type UnionToIntersection<U> = (
	U extends any
		? (x: U) => void
		: never
) extends (x: infer I) => void
	? I
	: never

/**
 * Get the “last” element of a union (order is arbitrary)
 */
export type LastInUnion<U> = UnionToIntersection<
	U extends any ? (x: U) => void : never
> extends (x: infer Last) => void
	? Last
	: never

/**
 * Convert a union to a tuple
 */
export type Distill<T, Last = LastInUnion<T>> = [T] extends [never]
	? []
	: [...Distill<Exclude<T, Last>>, Last]
