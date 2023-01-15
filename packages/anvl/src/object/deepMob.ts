import { pipe } from "fp-ts/function"

import { reduce, slice } from "../array"
import { sprawl } from "./sprawl"

// type Container =

export const deepMob = <Tree extends Array<unknown> | object>(
  tree: Tree
): Tree => {
  const newTree = Array.isArray(tree)
    ? ([...tree] as Tree)
    : ({ ...tree } as Tree)
  const getNewNode = reduce<string, Tree>((acc, key) => {
    if (Array.isArray(acc)) return acc[Number(key)]
    return acc[key]
  }, tree)
  const getNewParentNode = (path: string[]): Error | Tree =>
    path.length > 0
      ? pipe(path, slice(0, -1), getNewNode)
      : Error(`Tried to get the parent of the root node.`)
  const setNewNode = (path: string[], oldChild: unknown): void => {
    const key = path[path.length - 1]
    const newParent = getNewParentNode(path)
    if (newParent instanceof Error) return
    const newChild = Array.isArray(oldChild)
      ? [...oldChild]
      : typeof oldChild === `object` && oldChild !== null
      ? { ...oldChild }
      : oldChild
    if (Array.isArray(parent)) parent[key] = oldChild
    else parent[key] = newChild
  }

  sprawl(tree, setNewNode)
  return newTree
}
