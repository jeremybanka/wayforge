import type { Tree } from "./tree.ts"
import type { TreeNodePathName, TreePathName } from "./tree-path-name.ts"
import type { Join, Split } from "./utility-types.ts"

/**
 * For a `Tree` `T`, a record from every {@link TreePathName} in `T` (joined together with separator `J`) to a value of type `D`.
 */
export type TreeMap<T extends Tree, D = unknown, J extends string = `/`> = {
	[K in Join<TreePathName<T>, J>]: D
}

/**
 * Make a record from each {@link TreePathName} in `T` (joined together with separator `J`) the same ${TreePathName} in array form.
 *
 * @param tree `T`, the source of truth for determining valid paths
 * @param separator (default `"/"`) the separator to use when joining each {@link TreePathName}
 * @returns a {@link TreeMap} of `T`
 */
export function flattenTree<T extends Tree, J extends string = `/`>(
	tree: T,
	separator = `/` as J,
): {
	[K in Join<TreePathName<T>, J>]: Split<K, J>
} {
	const treePathNames = {} as { [K in Join<TreePathName<T>, J>]: Split<K, J> }
	const discoveredBranches = discoverBranches(``, [], [], tree, separator)

	for (const [pathName, path] of discoveredBranches) {
		treePathNames[pathName as Join<TreePathName<T>, J>] = path as any
	}

	return treePathNames
}

/**
 * @internal
 */
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

/**
 * Make a {@link TreeMap} from each {@link TreePathName} in `T` (joined together with separator `J`) to some data of type `D`.
 *
 * @param tree `T`, the source of truth for determining valid paths
 * @param mapper a function that maps each {@link TreePathName} in `T` to a value of type `D`
 * @param separator (default `"/"`) the separator to use when joining each {@link TreePathName}
 * @returns a {@link TreeMap} of `T`
 */
export function mapTree<T extends Tree, D, J extends string = `/`>(
	tree: T,
	mapper: (
		path: TreePathName<T>,
		joinedPath: Join<TreePathName<T>, J>,
		tree: T,
	) => D,
	separator = `/` as J,
): TreeMap<T, D, J> {
	const treeMap = {} as TreeMap<T, D, J>
	const discoveredBranches = discoverBranches(``, [], [], tree, separator)
	for (const [pathName, path] of discoveredBranches) {
		treeMap[pathName as Join<TreePathName<T>, J>] = mapper(
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
