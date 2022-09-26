import { pipe } from "fp-ts/lib/function"
import {
  useRecoilTransaction_UNSTABLE,
  atom,
  atomFamily,
  selectorFamily,
  DefaultValue,
} from "recoil"
import type reactionSchema from "wayforge-server/gen/reaction.schema.json"
import z, { string } from "zod"

import { now } from "~/lib/id/now"
import type { Json } from "~/lib/json"
import { socketIndex, socketSync } from "~/lib/recoil-tools/effects/socket-io"
import type { Identified } from "~/lib/recoil-tools/effects/socket-io.server"
import {
  addToRecoilSet,
  removeFromRecoilSet,
} from "~/lib/recoil-tools/recoil-set"
import type { TransactionOperation } from "~/lib/recoil-tools/recoil-utils"

import type { Amount } from "./energy_reaction"
import {
  reactionProductsState,
  reactionReagentsState,
  energyFeaturesState,
} from "./energy_reaction"
import { socket } from "./socket"

export const TIME_UNITS = {
  ms: 1,
  s: 1000,
  m: 1000 * 60,
  h: 1000 * 60 * 60,
  d: 1000 * 60 * 60 * 24,
  w: 1000 * 60 * 60 * 24 * 7,
  y: 1000 * 60 * 60 * 24 * 365,
} as const

export type Reaction = z.infer<typeof reactionSchema>

export const DEFAULT_REACTION: Reaction = {
  id: ``,
  name: ``,
  time: 0,
  timeUnit: `ms`,
}

const stringSetJsonInterface = {
  toJson: (s: Set<string>) => Array.from(s),
  fromJson: (a: Json): Set<string> =>
    pipe(a, z.array(string()).parse, (a) => new Set(a)),
}

export const reactionIndex = atom<Set<string>>({
  key: `reactionIndex`,
  default: new Set(),
  effects: [
    socketIndex({
      type: `reaction`,
      socket,
      jsonInterface: stringSetJsonInterface,
    }),
  ],
})

export const findReactionState = atomFamily<Reaction, string>({
  key: `reaction`,
  default: DEFAULT_REACTION,
  effects: (id) => [
    socketSync({
      id,
      socket,
      type: `reaction`,
      jsonInterface: {
        toJson: (reaction) => reaction,
        fromJson: (json) => json as Reaction,
      },
    }),
  ],
})

export type ReactionRelations = {
  reagents: (Amount & Identified)[]
  products: (Amount & Identified)[]
}

export const findReactionWithRelationsState = selectorFamily<
  Reaction & ReactionRelations,
  string
>({
  key: `reactionWithRelations`,
  get:
    (id) =>
    ({ get }) => {
      const reaction = get(findReactionState(id))
      const reagentRelationSet = get(reactionReagentsState)
      const reagentEntries = reagentRelationSet.getRelationContentEntries(id)
      const reagents = reagentEntries.map(
        ([id, { amount }]): Amount & Identified => ({ id, amount })
      )
      const productRelationSet = get(reactionProductsState)
      const productEntries = productRelationSet.getRelationContentEntries(id)
      const products = productEntries.map(
        ([id, { amount }]): Amount & Identified => ({ id, amount })
      )
      return { ...reaction, reagents, products }
    },
  set:
    (reactionId) =>
    ({ get, set }, newValue) => {
      if (newValue instanceof DefaultValue) {
        return console.warn(`cannot set default value for reaction`)
      }
      const { products, reagents, ...reaction } = newValue
      set(findReactionState(reactionId), reaction)
      const newReagentRelationSet = get(reactionReagentsState).clone()
      const newProductRelationSet = get(reactionProductsState).clone()
      const newReagentEntries =
        newReagentRelationSet.getRelationContentEntries(reactionId)
      const removedReagentRelations = newReagentEntries.filter(
        ([id]) => !reagents.some((r) => r.id === id)
      )
      const addedReagentRelations = reagents.filter(
        (r) => !newReagentEntries.some(([id]) => id === r.id)
      )
      const modifiedReagentRelations = reagents.filter((r) =>
        newReagentEntries.some(
          ([id, { amount }]) => id === r.id && amount !== r.amount
        )
      )
      removedReagentRelations.forEach(([id]) =>
        newReagentRelationSet.remove(reactionId, id)
      )
      addedReagentRelations.forEach(({ id, amount }) =>
        newReagentRelationSet.set(reactionId, id, { amount })
      )
      modifiedReagentRelations.forEach(({ id, amount }) =>
        newReagentRelationSet.set(reactionId, id, { amount })
      )
      const newProductEntries =
        newProductRelationSet.getRelationContentEntries(reactionId)
      const removedProductRelations = newProductEntries.filter(
        ([id]) => !products.some((p) => p.id === id)
      )
      const addedProductRelations = products.filter(
        (p) => !newProductEntries.some(([id]) => id === p.id)
      )
      const modifiedProductRelations = products.filter((p) =>
        newProductEntries.some(
          ([id, { amount }]) => id === p.id && amount !== p.amount
        )
      )
      removedProductRelations.forEach(([id]) =>
        newProductRelationSet.remove(reactionId, id)
      )
      addedProductRelations.forEach(({ id, amount }) =>
        newProductRelationSet.set(reactionId, id, { amount })
      )
      modifiedProductRelations.forEach(({ id, amount }) =>
        newProductRelationSet.set(reactionId, id, { amount })
      )
      set(reactionReagentsState, newReagentRelationSet)
      set(reactionProductsState, newProductRelationSet)
    },
})

const addReaction: TransactionOperation<undefined, string> = ({ set }) => {
  const id = now()
  addToRecoilSet(set, reactionIndex, id)
  set(findReactionState(id), (current) => {
    return {
      ...current,
      id,
      name: `New Reaction`,
    }
  })
  return id
}
export const useAddReaction = (): (() => void) =>
  useRecoilTransaction_UNSTABLE((transactors) => () => addReaction(transactors))

export const addReactionAsEnergyFeature: TransactionOperation<string> = (
  transactors,
  energyId
) => {
  const { get, set } = transactors
  const reactionId = addReaction(transactors)
  const energyFeatures = get(energyFeaturesState).clone()
  set(energyFeaturesState, energyFeatures.set(energyId, reactionId))
}
export const useAddReactionAsEnergyFeature = (energyId: string): (() => void) =>
  useRecoilTransaction_UNSTABLE(
    (transactors) => () => addReactionAsEnergyFeature(transactors, energyId)
  )

export const removeReaction: TransactionOperation<string> = (
  { get, set },
  id
) => {
  removeFromRecoilSet(set, reactionIndex, id)
  const energyFeatures = get(energyFeaturesState).clone()
  const reactionReagents = get(reactionReagentsState).clone()
  const reactionProducts = get(reactionProductsState).clone()
  set(energyFeaturesState, energyFeatures.remove(id))
  set(reactionReagentsState, reactionReagents.remove(id))
  set(reactionProductsState, reactionProducts.remove(id))
}
export const useRemoveReaction = (): ((id: string) => void) =>
  useRecoilTransaction_UNSTABLE(
    (transactors) => (id) => removeReaction(transactors, id)
  )
