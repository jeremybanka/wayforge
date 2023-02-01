import type { RecoilState } from "recoil"

import type { Transact } from "./recoil-utils"

export type RecoilIndexOptions = {
  indexAtom: RecoilState<Set<string>>
  id: string
}

export const addToIndex: Transact<(options: RecoilIndexOptions) => void> = (
  { set },
  { indexAtom, id }
): void => set(indexAtom, (currentSet) => new Set(currentSet).add(id))

export const removeFromIndex: Transact<(options: RecoilIndexOptions) => void> = (
  { set },
  { indexAtom, id }
): void =>
  set(indexAtom, (currentSet) => {
    const newSet = new Set(currentSet)
    newSet.delete(id)
    return newSet
  })
