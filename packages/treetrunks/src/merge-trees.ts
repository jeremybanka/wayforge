import type { Flatten } from "./flatten"
import type { Tree } from "./tree"

export type MergeTrees<T extends Tree, U extends Tree> = [
	T[0] extends `required`
		? U[0] extends `required`
			? `required`
			: `optional`
		: `optional`,
	Flatten<{
		[K in keyof T[1] | keyof U[1]]: K extends keyof T[1]
			? K extends keyof U[1]
				? T[1][K] extends Tree
					? U[1][K] extends Tree
						? Flatten<MergeTrees<T[1][K], U[1][K]>>
						: U[1][K]
					: T[1][K]
				: T[1][K]
			: K extends keyof U[1]
				? U[1][K]
				: never
	}>,
]
