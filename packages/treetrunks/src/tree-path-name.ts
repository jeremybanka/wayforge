import type { Tree } from "./tree"

/**
 * For a `Tree`, the set of arrays that each hold a complete path within it.
 *
 * Wildcard segments are represented in their `$variable` form.
 *
 * @example
 * TreePathName<
 *  typeof required({
 *		hello: optional({
 *			world: null,
 *			$name: optional({
 * 				good: required({
 *					morning: null
 *				})
 *			})
 *  	}),
 *  })
 * > =
 *   | [`hello`]
 *   | [`hello`, `world`]
 *   | [`hello`, `$name`]
 *   | [`hello`, `$name`, `good`, `morning`]
 */
export type TreePathName<T extends Tree> = {
	[K in keyof T[1]]: T[0] extends `required`
		? T[1][K] extends Tree
			? [K, ...TreePathName<T[1][K]>]
			: [K]
		: (T[1][K] extends Tree ? [K, ...TreePathName<T[1][K]>] : [K]) | []
}[keyof T[1]]

/**
 * For a `Tree`, the set of arrays that each hold a path to any node within it.
 *
 * @example
 * TreeNodePathName<
 *  typeof required({
 *		hello: optional({
 *			world: null,
 *			$name: optional({
 * 				good: required({
 *					morning: null
 *				})
 *			})
 *  	}),
 *  })
 * > =
 *   | []
 *   | [`hello`]
 *   | [`hello`, `world`]
 *   | [`hello`, `$name`]
 *   | [`hello`, `$name`, `good`]
 *   | [`hello`, `$name`, `good`, `morning`]
 */
export type TreeNodePathName<T extends Tree> = {
	[K in keyof T[1]]:
		| (T[1][K] extends Tree ? [K, ...TreeNodePathName<T[1][K]>] : [K])
		| []
}[keyof T[1]]
