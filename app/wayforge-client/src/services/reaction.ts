import { pipe } from "fp-ts/lib/function"
import { useRecoilTransaction_UNSTABLE, atom, atomFamily } from "recoil"
import z, { string } from "zod"

import type reactionSchema from "~/gen/reaction.schema"
import { now } from "~/lib/id/now"
import type { Json } from "~/lib/json"
import { socketIndex, socketSync } from "~/lib/recoil-tools/effects/socket-io"
import {
  addToRecoilSet,
  removeFromRecoilSet,
} from "~/lib/recoil-tools/recoil-set"
import type { TransactionOperation } from "~/lib/recoil-tools/recoil-utils"
import { RelationManager } from "~/lib/relation-manager"

import { socket } from "./socket"

export type Reaction = z.infer<typeof reactionSchema>

export const DEFAULT_ENERGY: Reaction = {
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
  default: DEFAULT_ENERGY,
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

export type ReactionColorFinder = {
  id: string
  colorKey: `colorA` | `colorB`
}

const addReaction: TransactionOperation = ({ set }) => {
  const id = now()
  addToRecoilSet(set, reactionIndex, id)
  set(findReactionState(id), (current) => ({
    ...current,
    id,
    name: `New Reaction`,
  }))
}

const removeReaction: TransactionOperation<string> = ({ set }, id) => {
  removeFromRecoilSet(set, reactionIndex, id)
}

export const useAddReaction = (): (() => void) =>
  useRecoilTransaction_UNSTABLE((transactors) => () => addReaction(transactors))

export const useRemoveReaction = (): ((id: string) => void) =>
  useRecoilTransaction_UNSTABLE(
    (transactors) => (id) => removeReaction(transactors, id)
  )

export const Reactions = new RelationManager({
  config: {
    reagents: `reaction`,
    products: `reaction`,
  },
  relations: {},
})
