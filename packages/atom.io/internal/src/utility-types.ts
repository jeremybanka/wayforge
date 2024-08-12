export type Func = (...parameters: any[]) => any

export type Flat<R extends { [K in PropertyKey]: any }> = {
	[K in keyof R]: R[K]
}

export type Range<N extends number, A extends any[] = []> = A[`length`] extends N
	? A[`length`]
	: A[`length`] | Range<N, [...A, any]>
