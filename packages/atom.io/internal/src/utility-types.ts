export type Func = (...parameters: any[]) => any

export type Flat<R extends { [K in PropertyKey]: any }> = {
	[K in keyof R]: R[K]
}

export type Count<N extends number, A extends any[] = []> = [
	...A,
	any,
][`length`] extends N
	? A[`length`]
	: A[`length`] | Count<N, [...A, any]>

export type Each<E extends any[]> = {
	[P in Count<E[`length`]>]: E[P]
}
