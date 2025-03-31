import type { Tree } from "./tree"

export type TreePathName<T extends Tree> = {
	[K in keyof T[1]]: T[0] extends `required`
		? T[1][K] extends Tree
			? [K, ...TreePathName<T[1][K]>]
			: [K]
		: (T[1][K] extends Tree ? [K, ...TreePathName<T[1][K]>] : [K]) | []
}[keyof T[1]]

export type TreePathNameExhaustive<T extends Tree> = {
	[K in keyof T[1]]:
		| (T[1][K] extends Tree ? [K, ...TreePathNameExhaustive<T[1][K]>] : [K])
		| []
}[keyof T[1]]
