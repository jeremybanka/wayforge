import { Junction } from "atom.io/internal"
import type { Refinement } from "atom.io/introspection"
import { jsonRefinery } from "atom.io/introspection"
import type { Json } from "atom.io/json"
import { isJson } from "atom.io/json"
import { vitest } from "vitest"
import { z } from "zod"

console.warn = () => undefined
const warn = vitest.spyOn(global.console, `warn`)

describe(`Junction.prototype.getRelatedKeys`, () => {
	it(`gets all keys related to a given key`, () => {
		const player = `Adelaide`
		const room = `Shrine`
		const playersInRooms = new Junction({
			between: [`player`, `room`],
			cardinality: `1:n`,
			relations: [
				[player, [room]],
				[room, [player]],
			],
		})
		const roomKeys = playersInRooms.getRelatedKeys(player)
		expect(roomKeys).toEqual(new Set([room]))
		const playerKeys = playersInRooms.getRelatedKeys(room)
		expect(playerKeys).toEqual(new Set([player]))
	})
})

describe(`Junction.prototype.getRelatedKey`, () => {
	it(`warns if there are multiple relations`, () => {
		const player = `Helena`
		const roomA = `Shrine`
		const roomB = `Loft`
		const playersInRooms = new Junction(
			{
				between: [`player`, `room`],
				cardinality: `1:n`,
				relations: [[player, [roomA, roomB]]],
			},
			{ warn: console.warn },
		)
		const roomKey = playersInRooms.getRelatedKey(player)
		expect(roomKey).toEqual(roomA)
		expect(warn).toHaveBeenCalledWith(
			`2 related keys were found for key "Helena": ("Shrine", "Loft"). Only one related key was expected.`,
		)
	})
	it(`handles something totally unknown with grace`, () => {
		const playersInRooms = new Junction({
			between: [`room`, `player`],
			cardinality: `1:n`,
		})
		const roomKey = playersInRooms.getRelatedKey(`unknown`)
		expect(roomKey).toBeUndefined()
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
		const roomKeys = playersInRooms.set(room, player).getRelatedKeys(player)
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
			{
				isContent: (input): input is { amount: number } =>
					z.object({ amount: z.number() }).safeParse(input).success,
			},
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
			{
				isContent: (input): input is { amount: number } =>
					z.object({ amount: z.number() }).safeParse(input).success,
			},
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
			string,
			`follower`,
			string,
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
			{
				isContent: (input): input is { amount: number } =>
					z.object({ amount: z.number() }).safeParse(input).success,
			},
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
			{
				isContent: (input): input is { name: string } =>
					z.object({ name: z.string() }).safeParse(input).success,
			},
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
			.delete({ pokémon: `oddish` })
		expect(pokemonPrimaryTypes.getRelatedKey(`oddish`)).toBeUndefined()
		expect(pokemonPrimaryTypes.getRelatedKeys(`grass`)).toEqual(
			new Set([`bulbasaur`, `bellsprout`]),
		)
		pokemonPrimaryTypes.delete({ type: `grass` })
		expect(pokemonPrimaryTypes.getRelatedKeys(`grass`)).toEqual(undefined)
		expect(pokemonPrimaryTypes.getRelatedKey(`bulbasaur`)).toBeUndefined()
		expect(pokemonPrimaryTypes.getRelatedKey(`bellsprout`)).toBeUndefined()
	})
})

describe(`Junction.prototype.getRelationEntries`, () => {
	it(`gets all content entries for a given id`, () => {
		const friendships = new Junction(
			{
				between: [`from`, `to`],
				cardinality: `n:n`,
			},
			{
				isContent: (input): input is Json.Object => {
					if (!isJson(input)) return false
					const refined = jsonRefinery.refine(input)
					return refined.type === `object`
				},
			},
		)

			.set({ from: `omori`, to: `kel` }, { trust: 1 })
			.set({ from: `hero`, to: `kel` }, { brothers: true })
			.set({ from: `hero`, to: `omori` }, { agreeThat: `mari is very nice` })
		const heroFriendships = friendships.getRelationEntries({ from: `hero` })
		expect(heroFriendships).toEqual([
			[`kel`, { brothers: true }],
			[`omori`, { agreeThat: `mari is very nice` }],
		])
		expect(friendships.getRelationEntries({ to: `kel` })).toEqual([
			[`omori`, { trust: 1 }],
			[`hero`, { brothers: true }],
		])
		expect(friendships.getRelationEntries({ from: `aubrey` })).toEqual([])
	})
})

describe(`Junction.prototype.toJSON`, () => {
	it(`converts a Junction to JSON`, () => {
		const pokemonPrimaryTypes = new Junction(
			{
				between: [`type`, `pokémon`],
				cardinality: `1:n`,
			},
			{
				isContent: (input): input is { isDelta: boolean } =>
					z.object({ isDelta: z.boolean() }).safeParse(input).success,
			},
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

describe(`Junction.prototype.replaceRelations`, () => {
	describe(`safely`, () => {
		it(`replaces all relations for a given id`, () => {
			const pokemonTypes = [`grass`, `poison`] as const
			const pokedex = [`bulbasaur`, `oddish`, `chikorita`, `bellsprout`] as const
			const pokemonPrimaryTypes = new Junction(
				{
					between: [`type`, `pokémon`],
					cardinality: `n:n`,
				},
				{
					isAType: (input): input is (typeof pokemonTypes)[number] =>
						pokemonTypes.includes(input as any),
					isBType: (input): input is (typeof pokedex)[number] =>
						pokedex.includes(input as any),
				},
			)

				.set({ type: `grass`, pokémon: `bulbasaur` })
				.set({ type: `poison`, pokémon: `bulbasaur` })
				.set({ type: `grass`, pokémon: `oddish` })
				.set({ type: `grass`, pokémon: `chikorita` })
				.set({ type: `grass`, pokémon: `bellsprout` })
				.set({ type: `poison`, pokémon: `bellsprout` })
				.replaceRelations(`grass`, [`bulbasaur`, `oddish`])
			expect(pokemonPrimaryTypes.getRelatedKeys(`grass`)).toEqual(
				new Set([`bulbasaur`, `oddish`]),
			)
			expect(pokemonPrimaryTypes.getRelatedKeys(`bulbasaur`)).toEqual(
				new Set([`grass`, `poison`]),
			)
			expect(pokemonPrimaryTypes.getRelatedKeys(`bellsprout`)).toEqual(
				new Set().add(`poison`),
			)
			expect(pokemonPrimaryTypes.getRelatedKeys(`chikorita`)).toBeUndefined()
			pokemonPrimaryTypes.replaceRelations(`chikorita`, [`grass`])
			expect(pokemonPrimaryTypes.getRelatedKeys(`grass`)).toEqual(
				new Set([`bulbasaur`, `oddish`, `chikorita`]),
			)
		})
	})
	describe(`unsafely`, () => {
		it(`replaces all relations for a given id`, () => {
			const candyIngredients = new Junction(
				{
					between: [`ingredient`, `candy`],
					cardinality: `n:n`,
				},
				{
					makeContentKey: (...keys) => keys.sort().join(`:`),
					isAType: ((input): input is `🫙 ${string}` =>
						input.startsWith(`🫙 `)) satisfies Refinement<
						string,
						`🫙 ${string}`
					>,
					isContent: (input: unknown): input is { quantity: number } =>
						z.object({ quantity: z.number() }).safeParse(input).success,
				},
			)
				.set({ ingredient: `🫙 sugar`, candy: `gummi bears` }, { quantity: 1 })
				.set({ ingredient: `🫙 sugar`, candy: `chocolate` }, { quantity: 1 })
				.set({ ingredient: `🫙 butter`, candy: `gummi bears` }, { quantity: 1 })
				.set({ ingredient: `🫙 butter`, candy: `chocolate` }, { quantity: 2 })
				.set({ ingredient: `🫙 flour`, candy: `gummi bears` }, { quantity: 1 })
				.set({ ingredient: `🫙 flour`, candy: `chocolate` }, { quantity: 0.5 })
			expect(candyIngredients.getRelatedKeys(`🫙 sugar`)).toEqual(
				new Set([`gummi bears`, `chocolate`]),
			)
			expect(candyIngredients.getRelatedKeys(`🫙 butter`)).toEqual(
				new Set([`gummi bears`, `chocolate`]),
			)
			expect(candyIngredients.getRelatedKeys(`🫙 flour`)).toEqual(
				new Set([`gummi bears`, `chocolate`]),
			)
			candyIngredients.replaceRelations(
				`maple flake`,
				{ "🫙 maple syrup": { quantity: 12 } },
				{
					reckless: true,
				},
			)
			expect(candyIngredients.getRelatedKeys(`maple flake`)).toEqual(
				new Set([`🫙 maple syrup`]),
			)
			expect(
				candyIngredients.getContent(`🫙 maple syrup`, `maple flake`),
			).toEqual({
				quantity: 12,
			})
			candyIngredients.replaceRelations(
				`🫙 maple syrup`,
				{
					"canuck delight": { quantity: 100 },
				},
				{
					reckless: true,
				},
			)
			expect(candyIngredients.getRelatedKeys(`🫙 maple syrup`)).toEqual(
				new Set([`canuck delight`]),
			)
			expect(
				candyIngredients.getContent(`🫙 maple syrup`, `canuck delight`),
			).toEqual({
				quantity: 100,
			})
			expect(candyIngredients.getRelatedKeys(`canuck delight`)).toEqual(
				new Set([`🫙 maple syrup`]),
			)
			expect(candyIngredients.getRelatedKeys(`maple flake`)).toEqual(
				new Set([`🫙 maple syrup`]),
			) // still contains the old relation; hence reckless
		})
	})
})

describe(`Junction with external storage`, () => {
	it(`accepts external storage methods`, () => {
		type PlayerJoinedRoom = { joinedAt: number }
		const relationMap = new Map<string, Set<string>>()
		const contentMap = new Map<string, PlayerJoinedRoom>()
		const playersInRooms = new Junction(
			{
				between: [`room`, `player`],
				cardinality: `1:n`,
				relations: [[`Lounge`, [`Gertrude`]]],
				contents: [[`Lounge:Gertrude`, { joinedAt: Number.NaN }]],
			},
			{
				isAType: (input): input is string => typeof input === `string`,
				isBType: (input): input is string => typeof input === `string`,
				isContent: (input): input is { joinedAt: number } =>
					z.object({ joinedAt: z.number() }).safeParse(input).success,
				externalStore: {
					getContent: (key: string) => contentMap.get(key),
					setContent: (key: string, content: { joinedAt: number }) =>
						contentMap.set(key, content),
					deleteContent: (key: string) => contentMap.delete(key),
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
					replaceRelationsSafely: (a, bs) => {
						const aRelationsPrev = relationMap.get(a)
						if (aRelationsPrev) {
							for (const b of aRelationsPrev) {
								const bRelations = relationMap.get(b)
								if (bRelations) {
									if (bRelations.size === 1) {
										relationMap.delete(b)
									} else {
										bRelations.delete(a)
									}
									contentMap.delete(playersInRooms.makeContentKey(a, b))
								}
							}
						}
						relationMap.set(a, new Set(bs))
						for (const b of bs) {
							let bRelations = relationMap.get(b)
							if (bRelations) {
								bRelations.add(a)
							} else {
								bRelations = new Set([a])
								relationMap.set(b, bRelations)
							}
						}
					},
					replaceRelationsUnsafely: (a, bs) => {
						relationMap.set(a, new Set(bs))
						for (const b of bs) {
							const bRelations = new Set([a])
							relationMap.set(b, bRelations)
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

describe(`Junction.prototype.has`, () => {
	describe(`single param`, () => {
		it(`returns true if the relation exists`, () => {
			const player = `Helena`
			const room = `Shrine`
			const playersInRooms = new Junction({
				between: [`player`, `room`],
				cardinality: `1:n`,
				relations: [[player, [room]]],
			})
			expect(playersInRooms.has(player)).toBe(true)
		})
		it(`returns false if the relation does not exist`, () => {
			const player = `Helena`
			const room = `Shrine`
			const playersInRooms = new Junction({
				between: [`player`, `room`],
				cardinality: `1:n`,
				relations: [[player, [room]]],
			})
			expect(playersInRooms.has(`other player` as any)).toBe(false)
		})
	})
	describe(`dual param`, () => {
		it(`returns true if the relation exists`, () => {
			const player = `Helena`
			const room = `Shrine`
			const playersInRooms = new Junction({
				between: [`player`, `room`],
				cardinality: `1:n`,
				relations: [[player, [room]]],
			})
			expect(playersInRooms.has(player, room)).toBe(true)
		})
		it(`returns false if the relation does not exist`, () => {
			const player = `Helena`
			const room = `Shrine`
			const playersInRooms = new Junction({
				between: [`player`, `room`],
				cardinality: `1:n`,
				relations: [[player, [room]]],
			})
			expect(playersInRooms.has(player, `other room` as any)).toBe(false)
		})
		it(`returns false if neither thing exists`, () => {
			const playersInRooms = new Junction({
				between: [`player`, `room`],
				cardinality: `1:n`,
			})
			expect(playersInRooms.has(`other player`, `other room`)).toBe(false)
		})
	})
})
