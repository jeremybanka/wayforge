import type { Tree } from "./tree.ts"

const REST: unique symbol = Symbol(`REST`)

/**
 * For a `Tree`, the set of all paths through that tree.
 *
 * @example
 * TreePath<
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
 *   | [`hello`, string & {}]
 *   | [`hello`, string & {}, `good`, `morning`]
 */
export type TreePath<T extends Tree> = {
	[K in keyof T[1]]:
		| (K extends `$...${string}`
				? [string & {}, ...string[]]
				: T[1][K] extends Tree
					? [K extends `$${string}` ? string & {} : K, ...TreePath<T[1][K]>]
					: [K extends `$${string}` ? string & {} : K])
		| (T[0] extends `required` ? never : [])
}[keyof T[1]]

/**
 * Against `Tree` `T`, validate whether a possible `maybePath` goes through it
 *
 * @param tree `T`, the source of truth for determining valid paths
 * @param maybePath the path to validate
 * @returns refinement for `maybePath` into a {@link TreePath} of `T`
 */
export function isTreePath<T extends Tree>(
	tree: T,
	maybePath: unknown[],
): maybePath is TreePath<T> {
	let possibleTrees: (Tree | null | typeof REST)[] = [tree]

	for (const segment of maybePath) {
		if (typeof segment !== `string`) {
			return false // segments should always be strings
		}
		possibleTrees = possibleTrees.flatMap((t): (Tree | null | typeof REST)[] => {
			if (t === REST) return [REST]
			if (t === null) {
				return []
			}
			const treesDiscovered: (Tree | null | typeof REST)[] = []
			const branches = t[1]
			const segmentSubTree = Object.hasOwn(branches, segment)
				? branches[segment]
				: undefined
			if (segmentSubTree !== undefined) {
				treesDiscovered.push(segmentSubTree)
			}

			for (const [name, child] of Object.entries(branches)) {
				if (name.startsWith(`$`)) {
					treesDiscovered.push(name.startsWith(`$...`) ? REST : child)
				}
			}
			return treesDiscovered
		})
	}

	for (const possibleTree of possibleTrees) {
		if (possibleTree === null || possibleTree === REST) {
			return true
		}
		if (possibleTree[0] === `optional`) {
			return true
		}
	}
	return false
}
