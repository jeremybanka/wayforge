import { FC } from "react"

import { atom, atomFamily, useRecoilState } from "recoil"
import type z from "zod"

import { RelationManager } from "../../lib/relation-manager"
import type energySchema from "../../wayfarer/schema/zod/energy.schema"

export type Energy = z.infer<typeof energySchema>

export const energyIndex = atom<string[]>({
  key: `energyIndex`,
  default: [],
})

export const findEnergyState = atomFamily<Energy, string>({
  key: `energy`,
  default: {
    id: ``,
    name: ``,
    color: ``,
    icon: ``,
  },
})

export const Reactions = new RelationManager({
  config: {
    reagents: `energy`,
    products: `energy`,
  },
  relations: {},
})

console.log(Reactions)
