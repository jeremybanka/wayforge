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
