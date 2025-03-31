import type { Tree } from "./tree"

export type TreePath<T extends Tree> = {
	[K in keyof T[1]]: T[0] extends `required`
		? T[1][K] extends Tree
			? [K extends `$${string}` ? string & {} : K, ...TreePath<T[1][K]>]
			: [K extends `$${string}` ? string & {} : K]
		:
				| (T[1][K] extends Tree
						? [K extends `$${string}` ? string & {} : K, ...TreePath<T[1][K]>]
						: [K extends `$${string}` ? string & {} : K])
				| []
}[keyof T[1]]

export function isTreePath<T extends Tree>(
	tree: T,
	maybePath: unknown[],
): maybePath is TreePath<T> {
	let possibleTrees: (Tree | null)[] = [tree]

	for (const segment of maybePath) {
		if (typeof segment !== `string`) {
			return false // segments should always be strings
		}
		possibleTrees = possibleTrees.flatMap((t) => {
			if (t === null) {
				return []
			}
			const treesDiscovered: (Tree | null)[] = []
			const branches = t[1]
			const segmentSubTree = branches[segment]
			if (segmentSubTree !== undefined) {
				treesDiscovered.push(segmentSubTree)
			}

			const wildcard = Object.keys(branches).find((key) => key.startsWith(`$`))
			if (wildcard) {
				const wildcardSubTree = branches[wildcard]
				if (wildcardSubTree) {
					treesDiscovered.push(wildcardSubTree)
				}
			}
			return treesDiscovered
		})
	}

	for (const possibleTree of possibleTrees) {
		if (possibleTree === null) {
			return true
		}
		if (possibleTree[0] === `optional`) {
			return true
		}
	}
	return false
}
