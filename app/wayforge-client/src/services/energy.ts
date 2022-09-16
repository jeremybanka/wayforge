import { pipe } from "fp-ts/lib/function"
import {
  useRecoilTransaction_UNSTABLE,
  atom,
  atomFamily,
  selectorFamily,
} from "recoil"
import z, { string } from "zod"

import type energySchema from "~/gen/energy.schema"
import type { Index1ToMany } from "~/lib/dynamic-relations/1ToMany"
import { now } from "~/lib/id/now"
import type { Json } from "~/lib/json"
import { socketIndex, socketSync } from "~/lib/recoil-tools/effects/socket-io"
import {
  addToRecoilSet,
  removeFromRecoilSet,
} from "~/lib/recoil-tools/recoil-set"
import type { TransactionOperation } from "~/lib/recoil-tools/recoil-utils"
import { RelationManager } from "~/lib/relation-manager"

import type { Reaction } from "./reaction"
import { socket } from "./socket"

export type Energy = z.infer<typeof energySchema>

// each energy has many reactions as features on its card
// each reaction has one card on which it is a feature

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
      jsonInterface: {
        toJson: (energy) => energy,
        fromJson: (json) => json as Energy,
      },
    }),
  ],
})

// export const findEnergyReactionsState = atom<Index1ToMany>({
//   key: `energyReactions`,
//   default: new Index1ToMany(),
//   effects: [

// export type EnergyGlobalRelations = {
//   reaction: {
//     provider: Index1ToMany<string, string>
//     prod
//   }
// }

export type EnergyRelationsExtracted = {
  reaction: {
    provider: Reaction[]
    product: Reaction[]
    reagent: Reaction[]
  }
}

export const findEnergyWithRelationsState = selectorFamily<
  Energy & { $relations: EnergyRelationsExtracted },
  string
>({})

export type EnergyColorFinder = {
  id: string
  colorKey: `colorA` | `colorB`
}

const addEnergy: TransactionOperation = ({ set }) => {
  const id = now()
  addToRecoilSet(set, energyIndex, id)
  set(findEnergyState(id), (current) => ({
    ...current,
    id,
    name: `New Energy`,
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
