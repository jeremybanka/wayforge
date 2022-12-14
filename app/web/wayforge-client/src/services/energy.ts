import { pipe } from "fp-ts/lib/function"
import {
  useRecoilTransaction_UNSTABLE,
  atom,
  atomFamily,
  selectorFamily,
  DefaultValue,
} from "recoil"
import type energySchema from "wayforge-server/gen/energy.schema.json"
import z, { string } from "zod"

import { now } from "~/packages/anvl/src/id/now"
import type { Json } from "~/packages/anvl/src/json"
import {
  socketIndex,
  socketSync,
} from "~/packages/hamr/recoil-tools/effects/json-store-io.web"
import {
  addToIndex,
  removeFromIndex,
} from "~/packages/hamr/recoil-tools/recoil-index"
import type { TransactionOperation } from "~/packages/hamr/recoil-tools/recoil-utils"

import { energyFeaturesState } from "./energy_reaction"
import { socket } from "./socket"

export type Energy = z.infer<typeof energySchema>

// each energy has many reactions as features on its card
// each reaction has one energy card on which it is a feature

// each reaction has many energies as reagents
// each energy has many reactions where it is a reagent

// each reaction has many energies as products
// each energy has many reactions where it is a product

export const DEFAULT_ENERGY: Energy = {
  id: ``,
  name: ``,
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
  ],
})

export const findEnergyState = atomFamily<Energy, string>({
  key: `energy`,
  default: DEFAULT_ENERGY,
  effects: (id) => [
    socketSync({
      id,
      socket,
      type: `energy`,
    }),
  ],
})

export type EnergyRelations = {
  features: { id: string }[]
}

export const findEnergyWithRelationsState = selectorFamily<
  Energy & EnergyRelations,
  string
>({
  key: `energyWithRelations`,
  get:
    (id) =>
    ({ get }) => {
      const energy = get(findEnergyState(id))
      const features = get(energyFeaturesState).getRelations(id)
      return { ...energy, features }
    },
  set:
    (energyId) =>
    ({ set }, newValue) => {
      if (newValue instanceof DefaultValue) {
        return console.warn(`cannot set default value for energy`)
      }
      const { features, ...energy } = newValue
      set(findEnergyState(energyId), energy)
      set(energyFeaturesState, (j) => j.setRelations(energyId, features))
    },
})

const addEnergy: TransactionOperation = (transactors) => {
  const { set } = transactors
  const id = now()
  addToIndex(transactors, { id, indexAtom: energyIndex })
  set(findEnergyState(id), (current) => ({
    ...current,
    id,
    name: `New Energy`,
  }))
}

const removeEnergy: TransactionOperation<string> = (transactors, id) =>
  removeFromIndex(transactors, { id, indexAtom: energyIndex })

export const useAddEnergy = (): (() => void) =>
  useRecoilTransaction_UNSTABLE((transactors) => () => addEnergy(transactors))

export const useRemoveEnergy = (): ((id: string) => void) =>
  useRecoilTransaction_UNSTABLE(
    (transactors) => (id) => removeEnergy(transactors, id)
  )
