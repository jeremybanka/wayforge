import type { RecoilState, TransactionInterface_UNSTABLE } from "recoil"

export const addToRecoilSet = <T>(
  set: TransactionInterface_UNSTABLE[`set`],
  state: RecoilState<Set<T>>,
  value: T
): void =>
  set(state, (currentSet) => {
    const newSet = new Set(currentSet)
    newSet.add(value)
    console.log({ newSet, currentSet, value, newRef: newSet === currentSet })
    return newSet
  })

export const removeFromRecoilSet = <T>(
  set: TransactionInterface_UNSTABLE[`set`],
  state: RecoilState<Set<T>>,
  value: T
): void =>
  set(state, (currentSet) => {
    // console.log(`removing ${value} from ${currentSet}`)
    const newSet = new Set(currentSet)
    newSet.delete(value)
    return newSet
  })
