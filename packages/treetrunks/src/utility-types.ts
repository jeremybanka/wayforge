/**
 * Join an array of strings `Arr` together with a `Separator`.
 */
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

/**
 * At instances of `Splitter` in split `Str` into an array of substrings.
 */
export type Split<
	Str extends string,
	Splitter extends string = `/`,
> = Str extends `${infer Head extends string}${Splitter}${infer Tail extends string}`
	? [Head, ...Split<Tail, Splitter>]
	: Str extends ``
		? []
		: [Str]

/**
 * In array `Arr`, replace elements starting with `VarMarker` with `string & {}`.
 */
export type Deref<
	Arr extends string[],
	VarMarker extends string = `$`,
> = Arr extends [`${infer Head extends string}`, ...infer Tail extends string[]]
	? Head extends `${VarMarker}${string}`
		? [string & {}, ...Deref<Tail, VarMarker>]
		: [Head, ...Deref<Tail, VarMarker>]
	: []

export type Flatten<Record extends { [K in PropertyKey]: any }> = {
	[K in keyof Record]: Record[K]
}

/**
 * Convert a union (`|`) to an intersection (`&` ).
 */
export type UnionToIntersection<Union> = (
	Union extends any
		? (x: Union) => void
		: never
) extends (x: infer Item) => void
	? Item
	: never

/**
 * Get the “last” element of a union (order is arbitrary).
 */
export type LastInUnion<Union> =
	UnionToIntersection<Union extends any ? (x: Union) => void : never> extends (
		x: infer Last,
	) => void
		? Last
		: never

/**
 * Convert a union to a tuple, order not guaranteed.
 */
export type Distill<Union, Last = LastInUnion<Union>> = [Union] extends [never]
	? []
	: [...Distill<Exclude<Union, Last>>, Last]
