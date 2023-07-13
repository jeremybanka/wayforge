import { identity, pipe } from "fp-ts/function"

import type { InspectionResult } from "./sprawl"
import { sprawl } from "./sprawl"
import { reduce, slice } from "../array"

export const deepMob = <Tree extends Array<unknown> | object>(
	tree: Tree,
	fn: (
		child: unknown,
		path: string[],
		parent: Array<unknown> | object,
	) => { data?: unknown; meta?: InspectionResult } = (child) => ({
		data: child,
	}),
): Tree => {
	const newTree = Array.isArray(tree)
		? ([...tree] as Tree)
		: ({ ...tree } as Tree)
	const getNewNode = reduce<string, Tree>((acc, key) => {
		if (Array.isArray(acc)) return acc[Number(key)]
		return acc[key]
	}, newTree)
	const getNewParentNode = (path: string[]): Error | Tree =>
		path.length > 0
			? pipe(path, slice(0, -1), getNewNode)
			: Error(`Tried to get the parent of the root node.`)
	const setNewNode = (
		path: string[],
		oldChild: unknown,
	): InspectionResult | void => {
		const key = path[path.length - 1]
		const newParent = getNewParentNode(path)
		if (newParent instanceof Error) return
		const newChild = Array.isArray(oldChild)
			? [...oldChild]
			: typeof oldChild === `object` && oldChild !== null
			? { ...oldChild }
			: oldChild
		const { data, meta } = fn(newChild, path, newParent)
		newParent[key] = data
		return meta
	}

	sprawl(tree, setNewNode)
	return newTree
}
