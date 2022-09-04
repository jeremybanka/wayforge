import { pipe } from "fp-ts/lib/function"
import {
  useRecoilTransaction_UNSTABLE,
  atom,
  atomFamily,
  selectorFamily,
  DefaultValue,
} from "recoil"
import z, { string } from "zod"

import energySchema from "~/gen/energy.schema"
import { now } from "~/lib/id/now"
import type { Json } from "~/lib/json"
import { deserializeSet, serializeSet } from "~/lib/json"
import type { LuumSpec } from "~/lib/Luum/src"
import {
  localStorageSerializationEffect,
  localStorageEffect,
} from "~/lib/recoil-tools/effects/local-storage"
import { socketIndex, socketSync } from "~/lib/recoil-tools/effects/socket-io"
import {
  addToRecoilSet,
  removeFromRecoilSet,
} from "~/lib/recoil-tools/recoil-set"
import type { TransactionOperation } from "~/lib/recoil-tools/recoil-utils"
import { RelationManager } from "~/lib/relation-manager"

import { socket } from "./socket"

export type Energy = z.infer<typeof energySchema>

export const DEFAULT_ENERGY: Energy = {
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
}

const stringSetJsonInterface = {
  toJson: (s: Set<string>) => Array.from(s),
  fromJson: (a: Json): Set<string> =>
    pipe(a, z.array(string()).parse, (a) => new Set(a)),
}

export const energyIndex = atom<Set<string>>({
  key: `energyIndex`,
  default: new Set(),
  effects: [
    socketIndex({
      type: `energy`,
      socket,
      jsonInterface: stringSetJsonInterface,
    }),

    // localStorageSerializationEffect(`energyIndex`, {
    //   serialize: serializeSet,
    //   deserialize: deserializeSet,
    // }),
  ],
})

export const findEnergyState = atomFamily<Energy, string>({
  key: `energy`,
  default: DEFAULT_ENERGY,
  effects: (id) => [
    // localStorageEffect(`energy_${id}`),
    socketSync({
      id,
      socket,
      type: `energy`,
      jsonInterface: {
        toJson: (energy) => energy,
        fromJson: (json) => energySchema.parse(json),
      },
    }),
  ],
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
