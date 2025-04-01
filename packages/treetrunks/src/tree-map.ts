import type { Tree } from "./tree.ts"
import type { TreeNodePathName, TreePathName } from "./tree-path-name.ts"
import type { Join, Split } from "./utility-types.ts"

/**
 * For a `Tree` `T`, data of type `P` at each path in `T` is mapped to a key in the output.
 */
export type TreeMap<T extends Tree, P = unknown, J extends string = `/`> = {
	[K in Join<TreePathName<T>, J>]: P
}

export function flattenTree<T extends Tree, J extends string = `/`>(
	tree: T,
	separator = `/` as J,
): {
	[K in Join<TreePathName<T>, J>]: Split<K, J>
} {
	const treePathNames = {} as { [K in Join<TreePathName<T>, J>]: Split<K, J> }
	const discoveredBranches = discoverBranches(``, [], [], tree, separator)

	for (const [pathName, path] of discoveredBranches) {
		treePathNames[pathName] = path
	}

	return treePathNames
}

export function discoverBranches<J extends string = `/`>(
	basePrefix: string,
	basePath: string[],
	discoveredBranches: [pathName: string, path: string[]][],
	tree: Tree,
	separator = `/` as J,
): [pathName: string, path: string[]][] {
	const [status, branches] = tree
	if (status === `optional`) {
		discoveredBranches.push([basePrefix, basePath])
	}

	for (const [segment, maybeTree] of Object.entries(branches)) {
		const newPrefix = basePrefix
			? `${basePrefix}${separator}${segment}`
			: segment
		const newBasePath = [...basePath, segment]
		if (maybeTree === null || maybeTree[0] === `optional`) {
			discoveredBranches.push([newPrefix, newBasePath])
		}
		if (maybeTree) {
			discoverBranches(
				newPrefix,
				newBasePath,
				discoveredBranches,
				maybeTree,
				separator,
			)
		}
	}
	return discoveredBranches
}

export function mapTree<T extends Tree, P, J extends string = `/`>(
	tree: T,
	mapper: (
		path: TreePathName<T>,
		joinedPath: Join<TreePathName<T>, J>,
		tree: T,
	) => P,
	separator = `/` as J,
): TreeMap<T, P, J> {
	const treeMap = {} as TreeMap<T, P, J>
	const discoveredBranches = discoverBranches(``, [], [], tree, separator)
	for (const [pathName, path] of discoveredBranches) {
		treeMap[pathName] = mapper(
			path as TreePathName<T>,
			pathName as Join<TreePathName<T>, J>,
			tree,
		)
	}
	return treeMap
}

export type TreeMapExhaustive<T extends Tree, P, J extends string = `/`> = {
	[K in Join<TreeNodePathName<T>, J>]: P
}
