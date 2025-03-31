export type Flat<R extends { [K in PropertyKey]: any }> = {
	[K in keyof R]: R[K]
}
