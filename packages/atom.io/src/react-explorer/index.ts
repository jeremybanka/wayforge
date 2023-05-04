import type { Refinement } from "fp-ts/lib/Refinement"

import { isArray } from "~/packages/anvl/src/array"

import type { AtomToken, Write } from ".."

export * from "./AtomIOExplorer"

export type InfinitelyNestedArray<T> = InfinitelyNestedArray<T>[] | T
export const isInfinitelyNestedArray =
  <T>(isContent: Refinement<unknown, T>) =>
  (value: unknown): value is InfinitelyNestedArray<T> =>
    isArray(isInfinitelyNestedArray(isContent))(value) || isContent(value)

export type AtomicIndexOptions = {
  indexAtom: AtomToken<Set<string>>
  id: string
}

export const addToIndex: Write<(options: AtomicIndexOptions) => void> = (
  { set },
  { indexAtom, id }
): void => set(indexAtom, (currentSet) => new Set(currentSet).add(id))

export const removeFromIndex: Write<(options: AtomicIndexOptions) => void> = (
  { set },
  { indexAtom, id }
): void =>
  set(indexAtom, (currentSet) => {
    const newSet = new Set(currentSet)
    newSet.delete(id)
    return newSet
  })
