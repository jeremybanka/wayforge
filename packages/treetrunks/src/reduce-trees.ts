import { type MergeTrees, mergeTrees } from "./merge-trees.ts"
import type { Tree } from "./tree.ts"
import type { Flatten } from "./utility-types.ts"

/**
 * For a tuple of `Tree`s, combine them all into a single `Tree`.
 *
 * @example
 * ReduceTrees<
 *   [
 *     typeof required({ x: null }),
 *     typeof required({ y: null }),
 *     typeof required({ z: null }),
 *   ]
 * > = typeof required({ x: null, y: null, z: null })
 */
export type ReduceTrees<
	Tuple extends Tree[],
	Acc extends MergeTrees<any, any> | Tree = [`required`, {}],
> = Tuple extends [infer Head, ...infer Rest]
	? Head extends Tree
		? Rest extends Tree[]
			? Flatten<ReduceTrees<Rest, MergeTrees<Acc, Head>>>
			: never
		: never
	: Acc

/**
 * For any number of `Tree`s, combine them all into a single `Tree`.
 *
 * @param {...string} trees a tuple of `Tree`s to combine
 * @returns
 * a {@link ReduceTrees} type of the combined `Tree`s
 */
export function reduceTrees<T extends Tree[]>(
	...trees: T
): ReduceTrees<T> & Tree {
	const base = trees.pop()
	if (base === undefined) {
		return [`required`, {}] as ReduceTrees<T>
	}
	return trees.reduce(
		(acc, tree) => mergeTrees(acc, tree) as Tree,
		base,
	) as ReduceTrees<T>
}
