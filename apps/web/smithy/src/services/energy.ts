import { pipe } from "fp-ts/function"
import { atom, atomFamily, selectorFamily, transaction } from "atom.io"
import z, { string } from "zod"

import type energySchema from "~/apps/node/forge/gen/energy.schema.json"
import { now } from "~/packages/anvl/src/id/now"
import type { JsonSchema } from "~/packages/anvl/src/json-schema/json-schema"
import {
	socketIndex,
	socketSchema,
	socketSync,
} from "~/packages/socket-io.filestore/src/socket-filestore-atom-client"

import { energyFeaturesState } from "./energy_reaction"
import { socket } from "./socket"
import { Json } from "atom.io/json"

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
	fromJson: (a: Json.Serializable): Set<string> =>
		pipe(a, z.array(string()).parse, (arr) => new Set(arr)),
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

export const energyAtoms = atomFamily<Energy, string>({
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

export const energyWithRelationsSelectors = selectorFamily<
	Energy & EnergyRelations,
	string
>({
	key: `energyWithRelations`,
	get:
		(id) =>
		({ get }) => {
			const energy = get(energyAtoms, id)
			const features = get(energyFeaturesState).getRelations(id)
			return { ...energy, features }
		},
	set:
		(energyId) =>
		({ set }, newValue) => {
			const { features, ...energy } = newValue
			set(energyAtoms, energyId, energy)
			set(energyFeaturesState, (j) => j.setRelations({ energyId }, features))
		},
})

export const energySchemaState = atom<JsonSchema>({
	key: `energySchema`,
	default: true,
	effects: [socketSchema({ type: `energy`, socket })],
})

export const addEnergyTX = transaction<() => void>({
	key: `addEnergy`,
	do: (transactors) => {
		const { set } = transactors
		const id = now()
		set(energyIndex, (current) => new Set([...current, id]))
		set(energyAtoms, id, (current) => ({
			...current,
			id,
			name: `New Energy`,
		}))
	},
})
