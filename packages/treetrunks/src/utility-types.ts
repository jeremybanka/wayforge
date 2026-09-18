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
			?
					| `${First}${Separator}${Join<Rest, Separator>}`
					| ([] extends Rest ? First : never)
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
 * Expand capture elements in a string tuple into the string types they accept, preserving literal elements.
 *
 * Ordinary captures expand to `string & {}`. A terminal rest capture expands to `[string & {}, ...(string & {})[]]`.
 *
 * @typeParam Arr - The array of literal and capture elements to expand.
 * @typeParam CapturePrefix - The prefix identifying a capture; defaults to `$`.
 * @typeParam RestMarker - The marker immediately following `CapturePrefix` to identify a rest capture; defaults to `...`.
 *
 * @example
 * type Expanded = ExpandCaptures<["literal", "$name", "$...items"]>
 * // ["literal", string & {}, string & {}, ...(string & {})[]]
 *
 * @example
 * type Custom = ExpandCaptures<["literal", ":name", ":*items"], ":", "*">
 * // ["literal", string & {}, string & {}, ...(string & {})[]]
 */
export type ExpandCaptures<
	Arr extends string[],
	CapturePrefix extends string = `$`,
	RestMarker extends string = `...`,
> = Arr extends [`${infer Head extends string}`, ...infer Tail extends string[]]
	? Head extends `${CapturePrefix}${RestMarker}${string}`
		? [string & {}, ...(string & {})[]]
		: Head extends `${CapturePrefix}${string}`
			? [string & {}, ...ExpandCaptures<Tail, CapturePrefix, RestMarker>]
			: [Head, ...ExpandCaptures<Tail, CapturePrefix, RestMarker>]
	: []

export type Flatten<Record extends { [K in PropertyKey]: any }> = {
	[K in keyof Record]: Record[K]
}

/**
 * Convert a union (`|`) to an intersection (`&` ).
 */
export type UnionToIntersection<Union> = (
	Union extends any ? (x: Union) => void : never
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
