import type { RecoilState, TransactionInterface_UNSTABLE } from "recoil"

export const addToRecoilSet = <T>(
  set: TransactionInterface_UNSTABLE[`set`],
  state: RecoilState<Set<T>>,
  value: T
): void =>
  set(state, (currentSet) => {
    const newSet = new Set(currentSet)
    newSet.add(value)
    return newSet
  })

export const removeFromRecoilSet = <T>(
  set: TransactionInterface_UNSTABLE[`set`],
  state: RecoilState<Set<T>>,
  value: T
): void =>
  set(state, (currentSet) => {
    const newSet = new Set(currentSet)
    newSet.delete(value)
    return newSet
  })
