import type { RecoilState, TransactionInterface_UNSTABLE } from "recoil"
import {
  SetRecoilState,
  useRecoilTransaction_UNSTABLE,
  atom,
  atomFamily,
} from "recoil"
import type z from "zod"

import type energySchema from "~/gen/energy.schema"
import type { TransactionOperation } from "~/lib/recoil/recoil-utils"
import { localStorageEffect } from "~/lib/recoil/recoil-utils"
import { RelationManager } from "~/lib/relation-manager"

export type Energy = z.infer<typeof energySchema>

export const energyIndex = atom<Set<number>>({
  key: `energyIndex`,
  default: new Set(),
})

export const findEnergyState = atomFamily<Energy, number>({
  key: `energy`,
  default: {
    id: NaN,
    name: ``,
    color: ``,
    icon: ``,
  },
  effects: [localStorageEffect(`energy`)],
})

const addToSet = <T>(
  set: TransactionInterface_UNSTABLE[`set`],
  state: RecoilState<Set<T>>,
  value: T
) =>
  set(state, (currentSet) => {
    currentSet.add(value)
    return currentSet
  })

const removeFromSet = <T>(
  set: TransactionInterface_UNSTABLE[`set`],
  state: RecoilState<Set<T>>,
  value: T
) =>
  set(state, (currentSet) => {
    currentSet.delete(value)
    return currentSet
  })

const addEnergy: TransactionOperation = ({ set }) => {
  console.log(`addEnergy`)
  const id = Date.now()
  addToSet(set, energyIndex, id)
  set(findEnergyState(id), {
    id,
    name: `New Energy`,
    color: `#ffffff`,
    icon: `lightbulb`,
  })
}

const removeEnergy: TransactionOperation<number> = ({ set }, id) => {
  removeFromSet(set, energyIndex, id)
}

export const useAddEnergy = (): (() => void) =>
  useRecoilTransaction_UNSTABLE((transactors) => () => addEnergy(transactors))

export const useRemoveEnergy = (): ((id: number) => void) =>
  useRecoilTransaction_UNSTABLE(
    (transactors) => (id) => removeEnergy(transactors, id)
  )

export const Reactions = new RelationManager({
  config: {
    reagents: `energy`,
    products: `energy`,
  },
  relations: {},
})

console.log(Reactions)
