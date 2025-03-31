import type { Join, Split } from "./join-split"
import type { Tree } from "./tree"
import type { TreeNodePathName, TreePathName } from "./tree-path-name"

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
	const treePathNames = {} as {
		[K in Join<TreePathName<T>, J>]: Split<K, J>
	}

	const [status, branches] = tree
	if (status === `optional`) {
		treePathNames[``] = []
	}
	for (const [segment, maybeTree] of Object.entries(branches)) {
		const isTerminal = maybeTree === null
		if (isTerminal) {
			treePathNames[segment] = [segment]
			continue
		}
		const isOptional = maybeTree[0] === `optional`
		if (isOptional) {
			treePathNames[segment] = [segment]
		}
		const discoveredBranches = discoverBranches(
			segment,
			[segment],
			[],
			maybeTree,
			separator,
		)
		console.log(`DISCOVERED BRANCHES:`, discoveredBranches)
		for (const [pathName, path] of discoveredBranches) {
			treePathNames[pathName] = path
		}
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
	for (const [segment, maybeTree] of Object.entries(branches)) {
		const newPrefix = `${basePrefix}${separator}${segment}`
		const newBasePath = [...basePath, segment]
		if (status === `optional` || maybeTree === null) {
			discoveredBranches.push([newPrefix, newBasePath])
		}
		if (maybeTree) {
			discoveredBranches.push(
				...discoverBranches(
					newPrefix,
					newBasePath,
					discoveredBranches,
					maybeTree,
					separator,
				),
			)
		}
	}
	return discoveredBranches
}

export function mapTree<T extends Tree, P, J extends string = `/`>(
	tree: T,
	mapper: (path: TreePathName<T>, tree: T) => P,
	separator = `/` as J,
): TreeMap<T, P, J> {}

export type TreeMapExhaustive<T extends Tree, P, J extends string = `/`> = {
	[K in Join<TreeNodePathName<T>, J>]: P
}
