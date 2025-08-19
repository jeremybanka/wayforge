/**
 * A `Tree` is a recursive, hierarchical structure of branches.
 *
 * From each branch, the branches that follow it may be marked as `required` or `optional`.
 *
 * `null` marks the end of a branch.
 *
 * @example
 * const greetingTree = required({
 *   greetings: null
 *   hi: optional({
 *     $name: null
 *   })
 * }) as const satisfies Tree
 */
export type Tree = OptionalTree | RequiredTree
export type OptionalTree = [`optional`, TreeBranches]
export type RequiredTree = [`required`, TreeBranches]
export type TreeBranches = Readonly<{ [key: string]: Tree | null }>

/**
 * Helper function to create a `Tree` with a `required` status.
 * @param branches an object holding the required segments from this point in the tree
 * @returns a {@link RequiredTree}
 */
export function required<B extends TreeBranches>(branches: B): [`required`, B] {
	return [`required`, branches]
}

/**
 * Helper function to create a `Tree` with an `optional` status.
 * @param branches an object holding the optional segments from this point in the tree
 * @returns an {@link OptionalTree}
 */
export function optional<B extends TreeBranches>(branches: B): [`optional`, B] {
	return [`optional`, branches]
}
