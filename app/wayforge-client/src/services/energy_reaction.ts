import { isNumber } from "fp-ts/lib/number"
import { atom } from "recoil"
import { object } from "zod"

import { isNull } from "~/lib/fp-tools"
import { isRecord } from "~/lib/fp-tools/object"
import { socketRelations } from "~/lib/recoil-tools/effects/socket-io"
import type { Identified } from "~/lib/recoil-tools/effects/socket-io.server"
import { RelationSet } from "~/lib/RelationSet"

import { socket } from "./socket"

export const energyFeaturesState = atom<RelationSet>({
  key: `energyFeatures`,
  default: new RelationSet(),
  effects: [
    socketRelations({
      type: `energy_reaction`,
      id: `energyFeatures`,
      socket,
      refineContent: isNull,
    }),
  ],
})

export type Amount = { amount: number }
export const hasAmount = isRecord((s): s is `amount` => s === `amount`, isNumber)
export const DEFAULT_ENERGY_AMOUNT: Amount = { amount: 1 }

export type Reagent = Amount & Identified
export type Product = Amount & Identified

export const reactionReagentsState = atom<RelationSet<Amount>>({
  key: `reactionReagents`,
  default: new RelationSet<{ amount: number }>(),
  effects: [
    socketRelations({
      type: `energy_reaction`,
      id: `reactionReagents`,
      socket,
      refineContent: hasAmount,
    }),
  ],
})

export const reactionProductsState = atom<RelationSet<Amount>>({
  key: `reactionProducts`,
  default: new RelationSet<Amount>(),
  effects: [
    socketRelations({
      type: `energy_reaction`,
      id: `reactionProducts`,
      socket,
      refineContent: hasAmount,
    }),
  ],
})
