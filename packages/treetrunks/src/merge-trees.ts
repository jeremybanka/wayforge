import type { Flatten } from "./flatten"
import type { Tree, TreeBranches } from "./tree"

export type MergeTrees<A extends Tree, B extends Tree> = [
	A[0] extends `required`
		? B[0] extends `required`
			? `required`
			: `optional`
		: `optional`,
	Flatten<{
		[K in keyof A[1] | keyof B[1]]: K extends keyof A[1]
			? K extends keyof B[1]
				? A[1][K] extends Tree
					? B[1][K] extends Tree
						? Flatten<MergeTrees<A[1][K], B[1][K]>>
						: A[1][K]
					: B[1][K]
				: B[1][K] extends Tree
					? B[1][K]
					: A[1][K]
			: K extends keyof B[1]
				? B[1][K]
				: never
	}>,
]

export function mergeTrees<A extends Tree, B extends Tree>(
	treeA: A,
	treeB: B,
): MergeTrees<A, B> & Tree {
	const status =
		treeA[0] === `required` && treeB[0] === `required` ? `required` : `optional`
	return [status, mergeTreesBranches(treeA[1], treeB[1])] as MergeTrees<A, B> &
		Tree
}

function mergeTreesBranches(
	branchesA: TreeBranches,
	branchesB: TreeBranches,
): TreeBranches {
	const newBranches: Record<string, Tree | null> = {}
	const keysCovered = new Set<string>()
	for (const [branchesX, branchesY] of [
		[branchesA, branchesB],
		[branchesB, branchesA],
	]) {
		for (const [key, valX] of Object.entries(branchesX)) {
			if (keysCovered.has(key)) {
				continue
			}
			keysCovered.add(key)
			const valY = branchesY[key]
			if (valX) {
				if (valY) {
					newBranches[key] = mergeTrees(valX, valY)
				} else {
					newBranches[key] = valX
				}
			} else {
				if (valY) {
					newBranches[key] = valY
				} else {
					newBranches[key] = null
				}
			}
		}
	}
	return newBranches
}
