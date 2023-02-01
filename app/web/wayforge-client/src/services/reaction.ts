import { pipe } from "fp-ts/function"
import {
  useRecoilTransaction_UNSTABLE,
  atom,
  atomFamily,
  selectorFamily,
  DefaultValue,
} from "recoil"
import z, { string } from "zod"

import type reactionSchema from "~/app/node/wayforge-server/gen/reaction.schema.json"
import {
  socketIndex,
  socketSync,
} from "~/packages/@store-io/src/json-store-io.web"
import type { Identified } from "~/packages/anvl/src/id/identified"
import { now } from "~/packages/anvl/src/id/now"
import type { Json } from "~/packages/anvl/src/json"
import { removeFromIndex } from "~/packages/hamr/recoil-tools/recoil-index"
import type { TransactionOperation } from "~/packages/hamr/recoil-tools/recoil-utils"

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
    }),
  ],
})

export type ReactionRelations = {
  reagents: (Amount & Identified)[]
  products: (Amount & Identified)[]
  featureOf: Identified | null
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
      const reactionReagents = get(reactionReagentsState)
      const reagents = reactionReagents.getRelations(id)
      const reactionProducts = get(reactionProductsState)
      const products = reactionProducts.getRelations(id)
      const energyFeatures = get(energyFeaturesState)
      const featureOf = energyFeatures.getRelation(id) ?? null
      return { ...reaction, reagents, products, featureOf }
    },
  set:
    (reactionId) =>
    ({ set }, newValue) => {
      if (newValue instanceof DefaultValue) {
        return console.warn(`cannot set default value for reaction`)
      }
      const { products, reagents, featureOf, ...reaction } = newValue
      set(findReactionState(reactionId), reaction)
      set(reactionProductsState, (j) => j.setRelations(reactionId, products))
      set(reactionReagentsState, (j) => j.setRelations(reactionId, reagents))
      if (featureOf !== null) {
        set(energyFeaturesState, (j) => j.set(reactionId, featureOf.id))
      }
    },
})

const addReaction: TransactionOperation<undefined, string> = ({ set }) => {
  const id = now()
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
  const energyFeatures = get(energyFeaturesState)
  set(energyFeaturesState, energyFeatures.set(energyId, reactionId))
}
export const useAddReactionAsEnergyFeature = (energyId: string): (() => void) =>
  useRecoilTransaction_UNSTABLE(
    (transactors) => () => addReactionAsEnergyFeature(transactors, energyId)
  )

export const removeReaction: TransactionOperation<string> = (
  transactors,
  id
) => {
  const { get, set } = transactors
  const energyFeatures = get(energyFeaturesState)
  const reactionReagents = get(reactionReagentsState)
  const reactionProducts = get(reactionProductsState)
  set(energyFeaturesState, energyFeatures.remove(id))
  set(reactionReagentsState, reactionReagents.remove(id))
  set(reactionProductsState, reactionProducts.remove(id))
  removeFromIndex(transactors, { id, indexAtom: reactionIndex })
}
export const useRemoveReaction = (): ((id: string) => void) =>
  useRecoilTransaction_UNSTABLE(
    (transactors) => (id) => removeReaction(transactors, id)
  )
