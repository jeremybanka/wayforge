import { atom, atomFamily, selectorFamily, transaction } from "atom.io"
import type z from "zod"

import type reactionSchema from "~/apps/node/forge/gen/reaction.schema.json"
import type { Identified } from "~/packages/anvl/src/id/identified"
import { now } from "~/packages/anvl/src/id/now"
import type { JsonSchema } from "~/packages/anvl/src/json-schema/json-schema"

import {
	socketIndex,
	socketSchema,
	socketSync,
} from "~/packages/socket-io.filestore/src/socket-filestore-atom-client"

import type { Amount } from "./energy_reaction"
import {
	energyFeaturesState,
	reactionProductsState,
	reactionReagentsState,
} from "./energy_reaction"
import { socket } from "./socket"
import { stringSetJsonInterface } from "anvl/json"

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

export const reactionAtoms = atomFamily<Reaction, string>({
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

export const reactionWithRelationsAtoms = selectorFamily<
	Reaction & ReactionRelations,
	string
>({
	key: `reactionWithRelations`,
	get:
		(id) =>
		({ get }) => {
			const reaction = get(reactionAtoms, id)
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
			const { products, reagents, featureOf, ...reaction } = newValue
			set(reactionAtoms, reactionId, reaction)
			set(reactionProductsState, (j) => j.setRelations({ reactionId }, products))
			set(reactionReagentsState, (j) => j.setRelations({ reactionId }, reagents))
			if (featureOf !== null) {
				set(energyFeaturesState, (j) =>
					j.set({ energyId: featureOf.id, reactionId }),
				)
			} else {
				set(energyFeaturesState, (j) => j.remove({ reactionId }))
			}
		},
})

export const reactionSchemaState = atom<JsonSchema>({
	key: `reactionSchema`,
	default: true,
	effects: [socketSchema({ type: `reaction`, socket })],
})

export const addReactionTX = transaction<() => string>({
	key: `addReaction`,
	do: ({ set }) => {
		const id = now()
		set(reactionAtoms, id, (current) => {
			return {
				...current,
				id,
				name: `New Reaction`,
			}
		})
		return id
	},
})

export const addReactionAsEnergyFeatureTX = transaction<(id: string) => void>({
	key: `addReactionAsEnergyFeature`,
	do: ({ get, set, run }, energyId) => {
		const reactionId = run(addReactionTX)()
		const energyFeatures = get(energyFeaturesState)
		set(energyFeaturesState, energyFeatures.set({ energyId, reactionId }))
	},
})

export const removeReactionTX = transaction<(id: string) => void>({
	key: `removeReaction`,
	do: ({ get, set }, reactionId) => {
		const energyFeatures = get(energyFeaturesState)
		const reactionReagents = get(reactionReagentsState)
		const reactionProducts = get(reactionProductsState)
		set(energyFeaturesState, energyFeatures.remove({ reactionId }))
		set(reactionReagentsState, reactionReagents.remove({ reactionId }))
		set(reactionProductsState, reactionProducts.remove({ reactionId }))
		set(reactionAtoms, reactionId, (current) => {
			return {
				...current,
				id: reactionId,
				name: `New Reaction`,
			}
		})
	},
})
