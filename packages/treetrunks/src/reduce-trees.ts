import type { MergeTrees } from "./merge-trees"
import type { Tree } from "./tree"

export type ReduceTrees<
	Tuple extends Tree[],
	Acc extends MergeTrees<any, any> | Tree = [`required`, {}],
> = Tuple extends [infer Head, ...infer Rest]
	? Head extends Tree
		? Rest extends Tree[]
			? ReduceTrees<Rest, MergeTrees<Acc, Head>>
			: never
		: never
	: Acc
