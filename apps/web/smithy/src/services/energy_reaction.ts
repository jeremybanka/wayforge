import { isNumber } from "fp-ts/number"
import { atom, selectorFamily } from "recoil"

import type { Identified } from "~/packages/anvl/src/id/identified"
import { Join } from "~/packages/anvl/src/join"
import { isRecord } from "~/packages/anvl/src/object/refinement"
import { socketRelations } from "~/packages/socket-io.filestore/src/socket-filestore-recoil"

import type { Energy } from "./energy"
import { DEFAULT_ENERGY, findEnergyState } from "./energy"
import { socket } from "./socket"

export const energyFeaturesState = atom<Join<null, `energyId`, `reactionId`>>({
	key: `energyFeatures`,
	default: new Join({ relationType: `1:n` }).from(`energyId`).to(`reactionId`),
	effects: [
		socketRelations({
			type: `energy_reaction`,
			id: `energyFeatures`,
			socket,
			refineContent: null,
			a: `energyId`,
			b: `reactionId`,
		}),
	],
})

export type Amount = { amount: number }
export const hasAmount = isRecord((s): s is `amount` => s === `amount`, isNumber)
export const DEFAULT_ENERGY_AMOUNT: Amount = { amount: 1 }

export type Reagent = Amount & Identified
export type Product = Amount & Identified

export const reactionReagentsState = atom<
	Join<Amount, `reactionId`, `energyId`>
>({
	key: `reactionReagents`,
	default: new Join<{ amount: number }>({ relationType: `n:n` })
		.from(`reactionId`)
		.to(`energyId`),
	effects: [
		socketRelations({
			type: `energy_reaction`,
			id: `reactionReagents`,
			socket,
			refineContent: hasAmount,
			a: `reactionId`,
			b: `energyId`,
		}),
	],
})

export const reactionProductsState = atom<
	Join<Amount, `reactionId`, `energyId`>
>({
	key: `reactionProducts`,
	default: new Join<Amount>({ relationType: `n:n` })
		.from(`reactionId`)
		.to(`energyId`),
	effects: [
		socketRelations({
			type: `energy_reaction`,
			id: `reactionProducts`,
			socket,
			refineContent: hasAmount,
			a: `reactionId`,
			b: `energyId`,
		}),
	],
})

export const findReactionEnergyState = selectorFamily<Energy, string>({
	key: `reactionEnergy`,
	get: (id) => ({ get }) => {
		const energyId = get(energyFeaturesState).getRelatedId(id)
		return energyId ? findEnergyState(energyId) : DEFAULT_ENERGY
	},
})
