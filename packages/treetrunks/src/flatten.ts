export type Flatten<R extends { [K in PropertyKey]: any }> = {
	[K in keyof R]: R[K]
}
