import type { Flatten } from "./flatten"
import { type MergeTrees, mergeTrees } from "./merge-trees"
import type { Tree } from "./tree"

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

export function reduceTrees<T extends Tree[]>(...trees: T): ReduceTrees<T> {
	const base = trees.pop()
	if (base === undefined) {
		return [`required`, {}] as ReduceTrees<T>
	}
	return trees.reduce(
		(acc, tree) => mergeTrees(acc, tree) as Tree,
		base,
	) as ReduceTrees<T>
}
