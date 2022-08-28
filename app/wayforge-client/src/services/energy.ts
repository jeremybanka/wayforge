import {
  useRecoilTransaction_UNSTABLE,
  atom,
  atomFamily,
  selectorFamily,
  DefaultValue,
} from "recoil"
import type z from "zod"

import type energySchema from "~/gen/energy.schema"
import { now } from "~/lib/id/now"
import { deserializeSet, serializeSet } from "~/lib/json"
import {
  localStorageSerializationEffect,
  localStorageEffect,
} from "~/lib/recoil-tools/effects/local-storage"
import {
  addToRecoilSet,
  removeFromRecoilSet,
} from "~/lib/recoil-tools/recoil-set"
import type { TransactionOperation } from "~/lib/recoil-tools/recoil-utils"
import { RelationManager } from "~/lib/relation-manager"
import type { LuumSpec } from "~/luum/src"

export type Energy = z.infer<typeof energySchema>

export const energyIndex = atom<Set<string>>({
  key: `energyIndex`,
  default: new Set(),
  effects: [
    localStorageSerializationEffect(`energyIndex`, {
      serialize: serializeSet,
      deserialize: deserializeSet,
    }),
  ],
})

export const findEnergyState = atomFamily<Energy, string>({
  key: `energy`,
  default: {
    id: `⚠️DEFAULT_ID⚠️`,
    name: `New Energy`,
    colorA: {
      hue: 0,
      sat: 0,
      lum: 0,
      prefer: `sat`,
    },
    colorB: {
      hue: 0,
      sat: 0,
      lum: 0,
      prefer: `sat`,
    },
    icon: ``,
  },
  effects: (id) => [localStorageEffect(`energy_${id}`)],
})

export type EnergyColorFinder = {
  id: string
  colorKey: `colorA` | `colorB`
}

export const findEnergyColorState = selectorFamily<LuumSpec, EnergyColorFinder>({
  key: `energyColor`,
  get:
    ({ id, colorKey }) =>
    ({ get }) => {
      const energy = get(findEnergyState(id))
      return energy[colorKey]
    },
  set:
    ({ id, colorKey }) =>
    ({ set }, newValue) => {
      if (newValue instanceof DefaultValue) {
        console.warn(`Cannot set default value for ${id} ${colorKey}`)
        return
      }
      set(findEnergyState(id), (current) => ({
        ...current,
        [colorKey]: newValue,
      }))
    },
})

const addEnergy: TransactionOperation = ({ set }) => {
  const id = now()
  addToRecoilSet(set, energyIndex, id)
  set(findEnergyState(id), (current) => ({
    ...current,
    id,
  }))
}

const removeEnergy: TransactionOperation<string> = ({ set }, id) => {
  removeFromRecoilSet(set, energyIndex, id)
}

export const useAddEnergy = (): (() => void) =>
  useRecoilTransaction_UNSTABLE((transactors) => () => addEnergy(transactors))

export const useRemoveEnergy = (): ((id: string) => void) =>
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
