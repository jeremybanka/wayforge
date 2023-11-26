import { vitest } from "vitest"

import type { Logger } from "atom.io"

import { Join } from "."
import type { Json } from "../json"

console.warn = () => undefined
const warn = vitest.spyOn(global.console, `warn`)

// pass in an id get all ids related to that id
// set a relation with 2 ids and some data
// remove a relation with 2 ids

describe(`Join`, () => {
	it(`can be constructed`, () => {
		const j = new Join()
		expect(j).toBeDefined()
	})
})

describe(`Join.prototype.getRelatedIds`, () => {
	it(`gets all ids related to a given id`, () => {
		const heart = `01`
		const heartMayBurn = `225`
		const energyCardFeatures = new Join({
			relationType: `1:n`,
			relations: {
				[heart]: [heartMayBurn],
			},
			contents: {},
		})
		const featureIds = energyCardFeatures.getRelatedIds(heart)
		expect(featureIds).toEqual([heartMayBurn])
	})
})

describe(`Join.prototype.getRelatedId`, () => {
	it(`warns if there are multiple relations`, () => {
		const heart = `01`
		const heartMayBurn = `225`
		const heartMayBleed = `226`
		const energyCardFeatures = new Join({
			relationType: `1:n`,
			relations: {
				[heart]: [heartMayBurn, heartMayBleed],
			},
			contents: {},
		})
		const featureId = energyCardFeatures.getRelatedId(heart)
		expect(featureId).toEqual(heartMayBurn)
		expect(warn).toHaveBeenCalledWith(
			`entry with id ${heart} was not expected to have multiple relations`,
		)
	})
})

describe(`Join.prototype.set`, () => {
	it(`sets a relation between two ids`, () => {
		const water = `06`
		const waterMayFreeze = `162`
		const energyCardFeatures = new Join().from(`reagent`).to(`reaction`)
		const featureIds = energyCardFeatures
			.set({ reagent: water, reaction: waterMayFreeze })
			.getRelatedIds(water)
		expect(featureIds).toEqual([waterMayFreeze])
	})
	it(`sets data between 2 ids`, () => {
		const fire = `03`
		const fireAndWaterBecomeSteam = `486`
		const reactionReagents = new Join<{ amount: number }>({
			relationType: `n:n`,
		})
			.from(`reagent`)
			.to(`reaction`)
			.set({ reagent: fire, reaction: fireAndWaterBecomeSteam }, { amount: 1 })
		const amountOfFire = reactionReagents.getContent(
			fire,
			fireAndWaterBecomeSteam,
		)
		expect(amountOfFire).toEqual({ amount: 1 })
	})
	it(`changes the data but doesn't duplicate the relation`, () => {
		const reactionReagents = new Join<{ amount: number }>()
		const fire = `03`
		const fireAndWaterBecomeSteam = `486`
		const newReagents = reactionReagents
			.set({ from: fire, to: fireAndWaterBecomeSteam }, { amount: 1 })
			.set({ from: fire, to: fireAndWaterBecomeSteam }, { amount: 2 })
		const amountOfFire = newReagents.getContent(fire, fireAndWaterBecomeSteam)
		expect(amountOfFire).toEqual({ amount: 2 })
		const featureIds = newReagents.getRelatedIds(fire)
		expect(featureIds).toEqual([fireAndWaterBecomeSteam])
	})
})

describe(`Join.prototype.set1ToMany`, () => {
	it(`sets a relation between a leader and a follower`, () => {
		const yellowGroup = `group_yellow`
		const redGroup = `group_red`
		const joey = `da_man_joey`
		const mary = `mary_paints`
		const memberships = new Join({ relationType: `1:n` })
			.from(`group`)
			.to(`user`)
		const newMemberships = memberships
			.set({ group: yellowGroup, user: joey })
			.set({ group: yellowGroup, user: mary })
		expect(newMemberships.getRelatedIds(yellowGroup)).toEqual([joey, mary])
		const newerMemberships = newMemberships.set({ group: redGroup, user: joey })
		expect(newerMemberships.getRelatedIds(redGroup)).toEqual([joey])
		expect(newerMemberships.getRelatedIds(yellowGroup)).toEqual([mary])
	})
	it(`sets data between a leader and a follower`, () => {
		const reactionReagents = new Join<{ amount: number }>({
			relationType: `1:n`,
		})
		const fire = `03`
		const fireAndWaterBecomeSteam = `486`
		const amountOfFire = reactionReagents
			.set({ from: fire, to: fireAndWaterBecomeSteam }, { amount: 1 })
			.getContent(fire, fireAndWaterBecomeSteam)
		expect(amountOfFire).toEqual({ amount: 1 })
	})
	it(`changes the data but doesn't duplicate the relation`, () => {
		const fire = `03`
		const fireAndWaterBecomeSteam = `486`
		const reactionReagents = new Join<{ amount: number }>({
			relationType: `1:n`,
		})
		const newReagents = reactionReagents
			.set({ from: fire, to: fireAndWaterBecomeSteam }, { amount: 1 })
			.set({ from: fire, to: fireAndWaterBecomeSteam }, { amount: 2 })
		const amountOfFire = newReagents.getContent(fire, fireAndWaterBecomeSteam)
		expect(amountOfFire).toEqual({ amount: 2 })
		const featureIds = newReagents.getRelatedIds(fire)
		expect(featureIds).toEqual([fireAndWaterBecomeSteam])
	})
})

describe(`Join.prototype.set1To1`, () => {
	it(`sets a relation between a wife and a husband`, () => {
		const mary = `mary_paints`
		const joey = `da_man_joey`
		const huey = `hueys_world`
		const marriedCouples = new Join({ relationType: `1:1` })
			.from(`wife`)
			.to(`husband`)
			.set({ wife: mary, husband: joey })
		expect(marriedCouples.getRelatedId(mary)).toEqual(joey)
		const newMarriedCouples = marriedCouples.set({ wife: mary, husband: huey })
		expect(newMarriedCouples.getRelatedId(mary)).toEqual(huey)
		expect(newMarriedCouples.getRelatedId(joey)).toBeUndefined()
	})
})

describe(`Join.prototype.remove`, () => {
	it(`removes a relation between two ids`, () => {
		const water = `06`
		const waterMayFreeze = `162`
		const energyCardFeatures = new Join()
			.from(`reagent`)
			.to(`reaction`)
			.set({ reagent: water, reaction: waterMayFreeze })
			.remove({ reagent: water, reaction: waterMayFreeze })
		const featureIds = energyCardFeatures.getRelatedIds(water)
		expect(featureIds).toEqual([])
	})
	it(`removes the content when removing two ids`, () => {
		const snad = `snad_pitt`
		const cassilda = `cassilda_jolie`
		const celebrityCouples = new Join<{ name: string }>()
			.set({ from: snad, to: cassilda }, { name: `snassilda` })
			.remove({ from: snad, to: cassilda })
		expect(celebrityCouples.getRelatedId(snad)).toEqual(undefined)
		expect(celebrityCouples.getRelatedId(cassilda)).toEqual(undefined)
		expect(celebrityCouples.getContent(snad, cassilda)).toEqual(undefined)
	})
	it(`removes all relations and content for a given id`, () => {
		const pokemonPrimaryTypes = new Join({ relationType: `1:n` })
			.from(`type`)
			.to(`pokémon`)
			.set({ type: `grass`, pokémon: `bulbasaur` })
			.set({ type: `grass`, pokémon: `oddish` })
			.set({ type: `grass`, pokémon: `bellsprout` })
			.remove({ type: `grass` })
		expect(pokemonPrimaryTypes.getRelatedIds(`grass`)).toEqual([])
		expect(pokemonPrimaryTypes.getRelatedId(`bulbasaur`)).toBeUndefined()
		expect(pokemonPrimaryTypes.getRelatedId(`oddish`)).toBeUndefined()
		expect(pokemonPrimaryTypes.getRelatedId(`bellsprout`)).toBeUndefined()
	})
})

describe(`Join.prototype.getRelatedIdEntries`, () => {
	it(`gets all content entries for a given id`, () => {
		const friendships = new Join<Json.Object>()
			.set({ from: `omori`, to: `kel` }, { trust: 1 })
			.set({ from: `hero`, to: `kel` }, { brothers: true })
			.set({ from: `hero`, to: `omori` }, { agreeThat: `mari is very nice` })
		const heroFriendships = friendships.getRelationEntries(`hero`)
		expect(heroFriendships).toEqual([
			[`kel`, { brothers: true }],
			[`omori`, { agreeThat: `mari is very nice` }],
		])
	})
})

describe(`Join.prototype.getRelationRecord`, () => {
	it(`gets all content for a given id`, () => {
		const friendships = new Join<Json.Object>()
			.set({ from: `omori`, to: `kel` }, { trust: 1 })
			.set({ from: `hero`, to: `kel` }, { brothers: true })
			.set({ from: `hero`, to: `omori` }, { agreeThat: `mari is very nice` })
		const heroFriendships = friendships.getRelationRecord(`hero`)
		expect(heroFriendships).toEqual({
			kel: { brothers: true },
			omori: { agreeThat: `mari is very nice` },
		})
	})
})

describe(`Join.prototype.toJSON`, () => {
	it(`converts a Join to JSON`, () => {
		const pokemonPrimaryTypes = new Join<{ isDelta: boolean }>({
			relationType: `1:n`,
		})
			.from(`type`)
			.to(`pokémon`)
			.set({ type: `grass`, pokémon: `bulbasaur` }, { isDelta: true })
			.set({ type: `grass`, pokémon: `oddish` }, { isDelta: true })
			.set({ type: `grass`, pokémon: `bellsprout` }, { isDelta: false })
		const json = pokemonPrimaryTypes.toJSON()
		expect(json).toEqual({
			relationType: `1:n`,
			a: `type`,
			b: `pokémon`,
			contents: {
				"bellsprout/grass": {
					isDelta: false,
				},
				"bulbasaur/grass": {
					isDelta: true,
				},
				"grass/oddish": {
					isDelta: true,
				},
			},
			relations: {
				bellsprout: [`grass`],
				bulbasaur: [`grass`],
				grass: [`bulbasaur`, `oddish`, `bellsprout`],
				oddish: [`grass`],
			},
		})
	})
})
