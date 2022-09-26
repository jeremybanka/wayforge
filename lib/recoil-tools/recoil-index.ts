import type { RecoilState, TransactionInterface_UNSTABLE } from "recoil"

import type { TransactionOperation } from "./recoil-utils"

export type RecoilIndexOptions = {
  indexAtom: RecoilState<Set<string>>
  id: string
}

export const addToIndex: TransactionOperation<RecoilIndexOptions> = (
  { set },
  { indexAtom, id }
): void => set(indexAtom, (currentSet) => new Set(currentSet).add(id))

export const removeFromIndex: TransactionOperation<RecoilIndexOptions> = (
  { set },
  { indexAtom, id }
): void =>
  set(indexAtom, (currentSet) => {
    const newSet = new Set(currentSet)
    newSet.delete(id)
    return newSet
  })
