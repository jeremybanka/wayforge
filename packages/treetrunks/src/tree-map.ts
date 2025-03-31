import type { Join } from "./join-split"
import type { Tree } from "./tree"
import type { TreePathName, TreePathNameExhaustive } from "./tree-path-name"

export type TreeMap<T extends Tree, P, J extends string = `/`> = {
	[K in Join<TreePathName<T>, J>]: P
}

export type TreeMapExhaustive<T extends Tree, P, J extends string = `/`> = {
	[K in Join<TreePathNameExhaustive<T>, J>]: P
}
