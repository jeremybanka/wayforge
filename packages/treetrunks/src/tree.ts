/**
 * A `Tree` is a recursive, hierarchical structure of branches.
 *
 * At a `required` node, a valid path must continue through a child branch. At an `optional` node, it may stop there or continue through a child branch.
 *
 * `null` marks the end of a branch.
 *
 * @example
 * const greetingTree = required({
 *   greetings: null,
 *   hi: optional({
 *     $name: null,
 *   }),
 * }) satisfies Tree
 */
export type Tree = OptionalTree | RequiredTree
export type OptionalTree = [`optional`, TreeBranches]
export type RequiredTree = [`required`, TreeBranches]
export type TreeBranches = Readonly<{ [key: string]: Tree | null }>

/**
 * Create a tree node where a valid path must continue through a child branch.
 *
 * A `$...name` leaf branch consumes at least one string segment. Use {@link optional} to also permit stopping at this node.
 *
 * @param branches child branches mapped to their subtrees, or `null` for terminal branches
 * @returns a {@link RequiredTree}
 *
 * @example
 * const tree = required({ "$...segments": null })
 * isTreePath(tree, []) // false
 * isTreePath(tree, ["one"]) // true
 * isTreePath(tree, ["one", "two"]) // true
 */
export function required<B extends TreeBranches>(branches: B): [`required`, B] {
	return [`required`, branches]
}

/**
 * Create a tree node where a valid path may stop or continue through a child branch.
 *
 * Stopping here does not select a child branch. A selected `$...name` leaf still consumes at least one string segment.
 *
 * @param branches child branches mapped to their subtrees, or `null` for terminal branches
 * @returns an {@link OptionalTree}
 *
 * @example
 * const tree = optional({ "$...segments": null })
 * isTreePath(tree, []) // true: stop at this node
 * isTreePath(tree, ["one"]) // true: select the rest branch
 * isTreePath(tree, ["one", "two"]) // true
 */
export function optional<B extends TreeBranches>(branches: B): [`optional`, B] {
	return [`optional`, branches]
}
