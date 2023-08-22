import { isBoolean } from "fp-ts/boolean"
import { isNumber } from "fp-ts/number"
import { isString } from "fp-ts/string"
import { vitest } from "vitest"

import { hasExactProperties, isPlainObject } from "~/packages/anvl/src/object"
import {
	isJson,
	refineJsonType,
} from "~/packages/anvl/src/refinement/refine-json"

import { Junction } from "../junction/src"
import type { Json } from "../types/src"

console.warn = () => undefined
const warn = vitest.spyOn(global.console, `warn`)

// pass in an id get all ids related to that id
// set a relation with 2 ids and some data
// remove a relation with 2 ids

describe(`Junction`, () => {
	it(`can be constructed`, () => {
		const j = new Junction({
			between: [`a`, `b`],
			cardinality: `1:n`,
		})
		expect(j).toBeDefined()
	})
})

describe(`Junction.prototype.getRelatedKeys`, () => {
	it(`gets all keys related to a given key`, () => {
		const player = `Adelaide`
		const room = `Shrine`
		const playersInRooms = new Junction({
			between: [`player`, `room`],
			cardinality: `1:n`,
			relations: [[player, [room]]],
		})
		const roomKeys = playersInRooms.getRelatedKeys(player)
		expect(roomKeys).toEqual(new Set([room]))
	})
})

describe(`Junction.prototype.getRelatedKey`, () => {
	it(`warns if there are multiple relations`, () => {
		const player = `Helena`
		const roomA = `Shrine`
		const roomB = `Loft`
		const playersInRooms = new Junction({
			between: [`player`, `room`],
			cardinality: `1:n`,
			relations: [[player, [roomA, roomB]]],
		})
		const roomKey = playersInRooms.getRelatedKey(player)
		expect(roomKey).toEqual(roomA)
		expect(warn).toHaveBeenCalledWith(
			`Multiple related keys were found for key "Helena": ("Shrine", "Loft"). Only one related key was expected.`,
		)
	})
})

describe(`Junction.prototype.set`, () => {
	it(`sets a relation between two ids`, () => {
		const player = `Adelaide`
		const room = `Sidewinder`
		const playersInRooms = new Junction({
			between: [`room`, `player`],
			cardinality: `1:n`,
		})
		const roomKeys = playersInRooms.set({ player, room }).getRelatedKeys(player)
		expect(roomKeys).toEqual(new Set([room]))
	})
	it(`sets data between two ids`, () => {
		const fire = `03`
		const fireAndWaterBecomeSteam = `486`
		const reactionReagents = new Junction(
			{
				between: [`reagent`, `reaction`],
				cardinality: `n:n`,
			},
			{ isContent: hasExactProperties({ amount: isNumber }) },
		).set({ reagent: fire, reaction: fireAndWaterBecomeSteam }, { amount: 1 })
		const amountOfFire = reactionReagents.getContent(
			fire,
			fireAndWaterBecomeSteam,
		)
		expect(amountOfFire).toEqual({ amount: 1 })
	})
	it(`changes the data but doesn't duplicate the relation`, () => {
		const reactionReagents = new Junction(
			{
				between: [`reagent`, `reaction`],
				cardinality: `n:n`,
			},
			{ isContent: hasExactProperties({ amount: isNumber }) },
		)
		const fire = `03`
		const fireAndWaterBecomeSteam = `486`
		const newReagents = reactionReagents
			.set({ reagent: fire, reaction: fireAndWaterBecomeSteam }, { amount: 1 })
			.set({ reagent: fire, reaction: fireAndWaterBecomeSteam }, { amount: 2 })
		const amountOfFire = newReagents.getContent(fire, fireAndWaterBecomeSteam)
		expect(amountOfFire).toEqual({ amount: 2 })
		const featureIds = newReagents.getRelatedKeys(fire)
		expect(featureIds).toEqual(new Set([fireAndWaterBecomeSteam]))
	})
})

describe(`Junction.prototype.set1ToMany`, () => {
	it(`sets a relation between a leader and a follower`, () => {
		const redGroup = `red`
		const yellowGroup = `yellow`
		const joey = `joey`
		const mary = `mary`

		const memberships = new Junction({
			between: [`group`, `user`],
			cardinality: `1:n`,
		})

		const newMemberships = memberships
			.set({ group: yellowGroup, user: joey })
			.set({ group: yellowGroup, user: mary })
		expect(newMemberships.getRelatedKeys(`yellow`)).toEqual(
			new Set([joey, mary]),
		)
		const newerMemberships = newMemberships.set({ group: redGroup, user: joey })
		expect(newerMemberships.getRelatedKeys(`yellow`)).toEqual(new Set([mary]))
		expect(newerMemberships.getRelatedKeys(`red`)).toEqual(new Set([joey]))
	})
	it(`sets data between a leader and a follower`, () => {
		const followersOfLeaders = new Junction<
			`leader`,
			`follower`,
			{ loyalty: number }
		>({
			cardinality: `1:n`,
			between: [`leader`, `follower`],
		})
		const grandmasterCaz = `grandmaster caz`
		const privateRival = `private rival`
		followersOfLeaders.set(
			{ leader: grandmasterCaz, follower: privateRival },
			{ loyalty: 1 },
		)
		const loyalty = followersOfLeaders.getContent(grandmasterCaz, privateRival)
		expect(loyalty).toEqual({ loyalty: 1 })
	})
	it(`changes the data but doesn't duplicate the relation`, () => {
		const fire = `03`
		const fireAndWaterBecomeSteam = `486`
		const reactionReagents = new Junction(
			{
				between: [`reagent`, `reaction`],
				cardinality: `1:n`,
			},
			{ isContent: hasExactProperties({ amount: isNumber }) },
		)
		const newReagents = reactionReagents
			.set({ reagent: fire, reaction: fireAndWaterBecomeSteam }, { amount: 1 })
			.set({ reagent: fire, reaction: fireAndWaterBecomeSteam }, { amount: 2 })
		const amountOfFire = newReagents.getContent(fire, fireAndWaterBecomeSteam)
		expect(amountOfFire).toEqual({ amount: 2 })
		const featureIds = newReagents.getRelatedKeys(fire)
		expect(featureIds).toEqual(new Set([fireAndWaterBecomeSteam]))
	})
})

describe(`Junction.prototype.set1To1`, () => {
	it(`sets a relation between a wife and a husband`, () => {
		const mary = `mary_paints`
		const joey = `da_man_joey`
		const huey = `hueys_world`
		const marriedCouples = new Junction({
			between: [`wife`, `husband`],
			cardinality: `1:1`,
		}).set({ wife: mary, husband: joey })
		expect(marriedCouples.getRelatedKey(mary)).toEqual(joey)
		const newMarriedCouples = marriedCouples.set({ wife: mary, husband: huey })
		expect(newMarriedCouples.getRelatedKey(mary)).toEqual(huey)
		expect(newMarriedCouples.getRelatedKey(joey)).toBeUndefined()
	})
})

describe(`Junction.prototype.delete`, () => {
	it(`removes a relation between two ids`, () => {
		const water = `06`
		const waterMayFreeze = `162`
		const energyCardFeatures = new Junction({
			between: [`reagent`, `reaction`],
			cardinality: `n:n`,
		})
			.set({ reagent: water, reaction: waterMayFreeze })
			.delete({ reagent: water, reaction: waterMayFreeze })
		const featureIds = energyCardFeatures.getRelatedKeys(water)
		expect(featureIds).toBeUndefined()
	})
	it(`removes the content when removing two ids`, () => {
		const snad = `snad_pitt`
		const cassilda = `cassilda_jolie`
		const celebrityCouples = new Junction(
			{
				between: [`celebrity0`, `celebrity1`],
				cardinality: `n:n`,
			},
			{ isContent: hasExactProperties({ name: isString }) },
		)
			.set({ celebrity0: snad, celebrity1: cassilda }, { name: `snassilda` })
			.delete({ celebrity0: snad, celebrity1: cassilda })
		expect(celebrityCouples.getRelatedKey(snad)).toEqual(undefined)
		expect(celebrityCouples.getRelatedKey(cassilda)).toEqual(undefined)
		expect(celebrityCouples.getContent(snad, cassilda)).toEqual(undefined)
	})
	it(`removes all relations and content for a given id`, () => {
		const pokemonPrimaryTypes = new Junction({
			between: [`type`, `pokémon`],
			cardinality: `1:n`,
		})

			.set({ type: `grass`, pokémon: `bulbasaur` })
			.set({ type: `grass`, pokémon: `oddish` })
			.set({ type: `grass`, pokémon: `bellsprout` })
			.delete({ type: `grass` })
		expect(pokemonPrimaryTypes.getRelatedKeys(`grass`)).toEqual(undefined)
		expect(pokemonPrimaryTypes.getRelatedKey(`bulbasaur`)).toBeUndefined()
		expect(pokemonPrimaryTypes.getRelatedKey(`oddish`)).toBeUndefined()
		expect(pokemonPrimaryTypes.getRelatedKey(`bellsprout`)).toBeUndefined()
	})
})

describe(`Junction.prototype.getRelatedIdEntries`, () => {
	it(`gets all content entries for a given id`, () => {
		const friendships = new Junction(
			{
				between: [`from`, `to`],
				cardinality: `n:n`,
			},
			{
				isContent: (input): input is Json.Object => {
					if (!isJson(input)) return false
					const refined = refineJsonType(input)
					return refined.type === `object`
				},
			},
		)

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

describe(`Junction.prototype.toJSON`, () => {
	it(`converts a Junction to JSON`, () => {
		const pokemonPrimaryTypes = new Junction(
			{
				between: [`type`, `pokémon`],
				cardinality: `1:n`,
			},
			{ isContent: hasExactProperties({ isDelta: isBoolean }) },
		)
			.set({ type: `grass`, pokémon: `bulbasaur` }, { isDelta: true })
			.set({ type: `grass`, pokémon: `oddish` }, { isDelta: true })
			.set({ type: `grass`, pokémon: `bellsprout` }, { isDelta: false })
		const json = pokemonPrimaryTypes.toJSON()
		expect(json).toEqual({
			cardinality: `1:n`,
			between: [`type`, `pokémon`],
			contents: [
				[`grass:bulbasaur`, { isDelta: true }],
				[`grass:oddish`, { isDelta: true }],
				[`grass:bellsprout`, { isDelta: false }],
			],
			relations: [
				[`grass`, [`bulbasaur`, `oddish`, `bellsprout`]],
				[`bulbasaur`, [`grass`]],
				[`oddish`, [`grass`]],
				[`bellsprout`, [`grass`]],
			],
		})
	})
})

describe(`Junction with external storage`, () => {
	it(`accepts external storage methods`, () => {
		const relationMap = new Map<string, Set<string>>()
		const contentMap = new Map<string, Json.Object>()
		const playersInRooms = new Junction(
			{
				between: [`room`, `player`],
				cardinality: `1:n`,
			},
			{
				isContent: hasExactProperties({ joinedAt: isNumber }),
				externalStore: {
					getContent: (key: string) => contentMap.get(key),
					setContent: (key: string, content: { joinedAt: number }) =>
						contentMap.set(`${key}`, content),
					deleteContent: (key: string) => contentMap.delete(`${key}`),
					getRelatedKeys: (key: string) => relationMap.get(key),
					addRelation: (keyA: string, keyB: string) => {
						const setA = relationMap.get(keyA) ?? new Set()
						setA.add(keyB)
						relationMap.set(keyA, setA)
						const setB = relationMap.get(keyB) ?? new Set()
						setB.add(keyA)
						relationMap.set(keyB, setB)
					},
					deleteRelation(a: string, b: string): void {
						const aRelations = relationMap.get(a)
						if (aRelations) {
							aRelations.delete(b)
							if (aRelations.size === 0) {
								relationMap.delete(a)
							}
							const bRelations = relationMap.get(b)
							if (bRelations) {
								bRelations.delete(a)
								if (bRelations.size === 0) {
									relationMap.delete(b)
								}
							}
						}
					},
					has: (a: string, b?: string) => {
						if (b) {
							const aRelations = relationMap.get(a)
							return aRelations?.has(b) ?? false
						}
						return relationMap.has(a)
					},
				},
			},
		)
		const room = `Shrine`
		const player = `Adelaide`
		const joinedAt = 162
		playersInRooms.set({ player, room }, { joinedAt })
		console.log({ relationMap })
		console.log({ contentMap })
		console.log(playersInRooms)
		expect(playersInRooms.has(room)).toBe(true)
		expect(playersInRooms.getRelatedKeys(player)).toEqual(new Set([room]))
		expect(playersInRooms.getContent(room, player)).toEqual({ joinedAt })
		playersInRooms.delete({ player, room })
		expect(playersInRooms.getRelatedKeys(player)).toBeUndefined()
		expect(playersInRooms.getContent(player, room)).toBeUndefined()
	})
})
