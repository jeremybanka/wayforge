/** biome-ignore-all lint/correctness/noUnusedVariables: we're inspecting types here */
import type { Above, Below, Hierarchy, Logger, Mutuals, Vassal } from "atom.io"
import {
	Anarchy,
	atom,
	atomFamily,
	decomposeCompound,
	disposeState,
	editRelations,
	findRelations,
	getState,
	join,
	mutableAtomFamily,
	Realm,
	redo,
	runTransaction,
	selectorFamily,
	setState,
	timeline,
	transaction,
	undo,
} from "atom.io"
import { clearStore, IMPLICIT } from "atom.io/internal"
import { UList } from "atom.io/transceivers/u-list"

import * as Utils from "../../__util__"

const LOG_LEVELS = [null, `error`, `warn`, `info`] as const
const CHOOSE = 2

let logger: Logger

beforeEach(() => {
	clearStore(IMPLICIT.STORE)
	IMPLICIT.STORE.config.lifespan = `immortal`
	IMPLICIT.STORE.loggers[0].logLevel = LOG_LEVELS[CHOOSE]
	logger = IMPLICIT.STORE.logger = Utils.createNullLogger()
	vitest.spyOn(logger, `error`)
	vitest.spyOn(logger, `warn`)
	vitest.spyOn(logger, `info`)
})
describe(`allocate + claim + deallocate`, () => {
	type GameKey = `game::${string}`
	type UserKey = `user::${string}`
	type PlayerKey = `T$--player==${GameKey}++${UserKey}`
	type ItemKey = `item::${string}`

	type GameHierarchy = Hierarchy<
		[
			{
				above: `root`
				below: [GameKey, UserKey]
			},
			{
				above: [GameKey, UserKey]
				below: PlayerKey
			},
			{
				above: GameKey
				below: [ItemKey]
			},
			{
				above: PlayerKey
				below: [ItemKey]
			},
		]
	>

	type GameVassal = Vassal<GameHierarchy>

	type AboveGame = Above<GameKey, GameHierarchy>
	type AboveUser = Above<UserKey, GameHierarchy>
	type AbovePlayer = Above<PlayerKey, GameHierarchy>
	type AboveItem = Above<ItemKey, GameHierarchy>

	type BelowGame = Below<GameKey, GameHierarchy>
	type BelowUser = Below<UserKey, GameHierarchy>
	type BelowGameUser = Below<[GameKey, UserKey], GameHierarchy>
	type BelowPlayer = Below<PlayerKey, GameHierarchy>
	type BelowItem = Below<ItemKey, GameHierarchy>

	type GameMutuals = Mutuals<GameKey, GameHierarchy>
	type UserMutuals = Mutuals<UserKey, GameHierarchy>
	type PlayerMutuals = Mutuals<PlayerKey, GameHierarchy>
	type ItemMutuals = Mutuals<ItemKey, GameHierarchy>
	const gameXKey = `game::xxx` satisfies GameKey
	const userAKey = `user::aaa` satisfies UserKey
	const userBKey = `user::bbb` satisfies UserKey
	const swordKey = `item::sword` satisfies ItemKey
	const shieldKey = `item::shield` satisfies ItemKey

	test(`happy path`, () => {
		const dampeningAtom = atom<number>({
			key: `dampening`,
			default: 10,
		})
		const attackPowerAtoms = atomFamily<number, ItemKey>({
			key: `attackPower`,
			default: 0,
		})
		const dampenedAttackPowerSelectors = selectorFamily<number, ItemKey>({
			key: `dampenedAttackPower`,
			get:
				(key) =>
				({ get }) => {
					const attackPower = get(attackPowerAtoms, key)
					const dampening = get(dampeningAtom)
					return Math.max(0, attackPower - dampening)
				},
		})

		const gameRealm = new Realm<GameHierarchy>(IMPLICIT.STORE)

		const gameXClaim = gameRealm.allocate(`root`, `game::xxx`)
		const userAClaim = gameRealm.allocate(`root`, userAKey)
		const userBClaim = gameRealm.allocate(`root`, userBKey)
		const playerXAClaim = gameRealm.fuse(`player`, gameXClaim, userAClaim)
		const playerXBClaim = gameRealm.fuse(`player`, gameXClaim, userBClaim)
		const swordClaim = gameRealm.allocate(playerXAClaim, swordKey)
		const shieldClaim = gameRealm.allocate(gameXClaim, shieldKey)

		let swordAttackPower: number
		swordAttackPower = getState(attackPowerAtoms, swordClaim)
		expect(swordAttackPower).toBe(0)
		setState(attackPowerAtoms, swordClaim, 35)

		swordAttackPower = getState(attackPowerAtoms, swordClaim)
		expect(swordAttackPower).toBe(35)
		expect(getState(dampenedAttackPowerSelectors, swordClaim)).toBe(25)

		disposeState(attackPowerAtoms, swordClaim)

		swordAttackPower = getState(attackPowerAtoms, swordClaim)
		expect(swordAttackPower).toBe(0)

		gameRealm.claim(playerXBClaim, swordClaim, `exclusive`)
		gameRealm.claim(playerXBClaim, shieldClaim, `exclusive`)

		gameRealm.deallocate(gameXClaim)

		expect(logger.warn).not.toHaveBeenCalled()
		expect(logger.error).not.toHaveBeenCalled()
	})
	test(`unhappy path`, () => {
		const durabilityAtoms = atomFamily<number, ItemKey>({
			key: `durability`,
			default: 0,
		})
		const dampeningAtom = atom<number>({
			key: `dampening`,
			default: 10,
		})
		const dampenedDurabilitySelectors = selectorFamily<number, ItemKey>({
			key: `dampenedDurability`,
			get:
				(key) =>
				({ find, get }) => {
					const durabilityAtom = find(durabilityAtoms, key)
					const durability = get(durabilityAtom)
					const dampening = get(dampeningAtom)
					return Math.max(1, durability - dampening)
				},
		})
		const doubleDurabilitySelectors = selectorFamily<number, ItemKey>({
			key: `doubleDurability`,
			get:
				(key) =>
				({ find, get }) => {
					const durabilityAtom = find(durabilityAtoms, key)
					const durability = get(durabilityAtom)
					const doubled = durability * 2
					return doubled
				},
			set:
				(key) =>
				({ find, get, set }) => {
					const durabilityAtom = find(durabilityAtoms, key)
					const durability = get(durabilityAtom)
					const halved = durability / 2
					set(durabilityAtom, halved)
				},
		})

		expect(logger.warn).not.toHaveBeenCalled()
		expect(logger.error).not.toHaveBeenCalled()
		let myItemDurability = getState(durabilityAtoms, swordKey)
		expect(logger.warn).toHaveBeenCalledTimes(1)
		expect(logger.error).toHaveBeenCalledTimes(1)
		expect(myItemDurability).toBe(0)
		setState(durabilityAtoms, swordKey, 35)
		expect(logger.warn).toHaveBeenCalledTimes(2)
		expect(logger.error).toHaveBeenCalledTimes(2)
		myItemDurability = getState(durabilityAtoms, swordKey)
		expect(logger.warn).toHaveBeenCalledTimes(3)
		expect(logger.error).toHaveBeenCalledTimes(3)
		expect(myItemDurability).toBe(0)
		const myDampenedDurability = getState(dampenedDurabilitySelectors, swordKey)
		expect(myDampenedDurability).toBe(1)
		expect(logger.warn).toHaveBeenCalledTimes(5)
		expect(logger.error).toHaveBeenCalledTimes(5)
		const myDoubledDurability = getState(doubleDurabilitySelectors, swordKey)
		expect(myDoubledDurability).toBe(0)
		expect(logger.warn).toHaveBeenCalledTimes(7)
		expect(logger.error).toHaveBeenCalledTimes(7)
	})
})
describe(`errors`, () => {
	test(`allocating under a non-existent claim`, () => {
		const anarchy = new Anarchy()
		anarchy.allocate(`me`, `myPet`)
		expect(IMPLICIT.STORE.molecules.size).toBe(1)
		expect(logger.error).toHaveBeenCalledTimes(1)
		anarchy.allocate([`me`, `you`], `myPet`)
	})
	test(`allocating under a previously disposed claim`, () => {
		const anarchy = new Anarchy()
		anarchy.allocate(`root`, `myself`)
		anarchy.deallocate(`myself`)
		anarchy.allocate(`myself`, `myPet`)
		expect(IMPLICIT.STORE.molecules.size).toBe(1)
		expect(logger.error).toHaveBeenCalledTimes(1)
	})
	test(`deallocating a non-existent claim`, () => {
		const anarchy = new Anarchy()
		anarchy.deallocate(`myself`)
		expect(IMPLICIT.STORE.molecules.size).toBe(1)
		expect(logger.error).toHaveBeenCalledTimes(1)
	})
	test(`deallocating a previously disposed claim`, () => {
		const anarchy = new Anarchy()
		anarchy.allocate(`root`, `me`)
		anarchy.deallocate(`me`)
		anarchy.deallocate(`me`)
		expect(logger.error).toHaveBeenCalledTimes(1)
	})
	test(`claiming a non-existent claim`, () => {
		const anarchy = new Anarchy()
		anarchy.allocate(`root`, `myself`)
		anarchy.claim(`myself`, `myPet`)
		expect(IMPLICIT.STORE.molecules.size).toBe(2)
		expect(logger.error).toHaveBeenCalledTimes(1)
	})
	test(`claiming a previously disposed claim`, () => {
		const anarchy = new Anarchy()
		anarchy.allocate(`root`, `myself`)
		anarchy.allocate(`root`, `myPet`)
		anarchy.deallocate(`myPet`)
		anarchy.claim(`myself`, `myPet`)
		expect(IMPLICIT.STORE.molecules.size).toBe(2)
		expect(logger.error).toHaveBeenCalledTimes(1)
	})
	test(`claiming a real claim under a non-existent claim`, () => {
		const anarchy = new Anarchy()
		anarchy.allocate(`root`, `myPet`)
		anarchy.claim(`myself`, `myPet`)
		expect(IMPLICIT.STORE.molecules.size).toBe(2)
		expect(logger.error).toHaveBeenCalledTimes(1)
	})
	test(`claiming a a real claim under a previously disposed claim`, () => {
		const anarchy = new Anarchy()
		anarchy.allocate(`root`, `myself`)
		anarchy.deallocate(`myself`)
		anarchy.allocate(`root`, `myPet`)
		anarchy.claim(`myself`, `myPet`)
		expect(IMPLICIT.STORE.molecules.size).toBe(2)
		expect(logger.error).toHaveBeenCalledTimes(1)
	})
	test(`getting a disposed claim`, () => {
		const countAtoms = atomFamily<number, string>({
			key: `count`,
			default: 0,
		})
		const sqrtSelectors = selectorFamily<number, string>({
			key: `sqrt`,
			get:
				(key) =>
				({ get }) =>
					Math.sqrt(get(countAtoms, key)),
		})
		const anarchy = new Anarchy()
		anarchy.allocate(`root`, `myself`)
		anarchy.deallocate(`myself`)
		getState(sqrtSelectors, `myself`)
		expect(logger.error).toHaveBeenCalledTimes(2)
		getState(sqrtSelectors, `myself`)
		expect(logger.error).toHaveBeenCalledTimes(3)
	})
	describe(`fallbacks/family defaults`, () => {
		test(`mutable - only one SetRTX is used`, () => {
			const listAtoms = mutableAtomFamily<UList<string>, string>({
				key: `list`,
				class: UList,
			})

			const list0 = getState(listAtoms, `example`)
			const list1 = getState(listAtoms, `example`)
			expect(list0).toBe(list1)
		})
		test(`regular, with static default`, () => {
			const nameAtoms = atomFamily<string, string>({
				key: `name`,
				default: `anonymous`,
			})

			const name = getState(nameAtoms, `example`)
			expect(name).toBe(`anonymous`)
		})
		test(`regular, with (K) => T default - one lucky value becomes default`, () => {
			const nameAtoms = atomFamily<string, string>({
				key: `name`,
				default: (key) => key,
			})

			const name = getState(nameAtoms, `example`)
			expect(name).toBe(`example`)
		})
		test(`test disposed fallback from selector get`, () => {
			type Point = { x: number; y: number }
			const pointAtoms = atomFamily<Point, number>({
				key: `point`,
				default: { x: 0, y: 0 },
			})

			const edgeLengthSelectors = selectorFamily<number, [number, number]>({
				key: `edgeLength`,
				get:
					([a, b]) =>
					({ get }) => {
						const aPoint = get(pointAtoms, a)
						const bPoint = get(pointAtoms, b)
						return Math.hypot(bPoint.x - aPoint.x, bPoint.y - aPoint.y)
					},
			})

			const anarchy = new Anarchy()

			anarchy.allocate(`root`, 1)
			anarchy.allocate(`root`, 2)
			anarchy.allocate(`root`, [1, 2])

			anarchy.deallocate(2)
			getState(edgeLengthSelectors, [1, 2])
		})
	})
})
describe(`integrations`, () => {
	test(`timeline support`, () => {
		const anarchy = new Anarchy()
		anarchy.allocate(`root`, `owner`)
		anarchy.allocate(`owner`, `owned_item`)

		const countAtoms = atomFamily<number, string>({
			key: `count`,
			default: 0,
		})

		const countTL = timeline({
			key: `count`,
			scope: [countAtoms],
		})

		setState(countAtoms, `owner`, 1)
		setState(countAtoms, `owned_item`, 1)

		anarchy.deallocate(`owner`)

		expect(getState(countAtoms, `owner`)).toBe(0)
		expect(getState(countAtoms, `owned_item`)).toBe(0)
		expect(logger.error).toHaveBeenCalledTimes(2)

		anarchy.allocate(`root`, `owner`)
		anarchy.allocate(`owner`, `owned_item`)

		setState(countAtoms, `owner`, 1)
		setState(countAtoms, `owned_item`, 1)

		undo(countTL)
		undo(countTL)
		undo(countTL)

		// Utils.inspectTimeline(countTL)

		expect(getState(countAtoms, `owner`)).toBe(1)
		expect(getState(countAtoms, `owned_item`)).toBe(1)
		expect(logger.error).toHaveBeenCalledTimes(2)
	})
	test(`transaction+timeline support`, () => {
		type DocumentKey = `document::${number}`
		type UserKey = `user::${string}`
		type UserGroupKey = `userGroup::${string}`
		type DocumentHierarchy = Hierarchy<
			[
				{
					above: `root`
					below: [UserKey, UserGroupKey]
				},
				{
					above: UserGroupKey
					below: [DocumentKey]
				},
				{
					above: UserKey
					below: [DocumentKey]
				},
			]
		>
		const documentRealm = new Realm<DocumentHierarchy>(IMPLICIT.STORE)

		const documentAtoms = atomFamily<string, DocumentKey>({
			key: `document`,
			default: ``,
		})

		const createDocumentTX = transaction<
			(owner: UserGroupKey | UserKey, id: number) => DocumentKey
		>({
			key: `createDocument`,
			do: ({ set }, owner, id) => {
				const documentKey = `document::${id}` satisfies DocumentKey
				documentRealm.allocate(owner, documentKey)
				set(documentAtoms, documentKey, `hello work!`)
				return documentKey
			},
		})
		const deleteDocumentTX = transaction<(document: DocumentKey) => void>({
			key: `deleteDocument`,
			do: (_, document) => {
				documentRealm.deallocate(document)
			},
		})
		function identity<T>(x: T): T {
			return x
		}
		const transferDocumentTX = transaction<
			(opts: {
				to: Above<DocumentKey, DocumentHierarchy>[]
				document: DocumentKey
			}) => void
		>({
			key: `transferDocument`,
			do: ({ set }, { to, document }) => {
				let exclusivity: `exclusive` | undefined = `exclusive`
				for (const newOwner of to) {
					documentRealm.claim(newOwner, document, exclusivity)
					exclusivity = undefined
				}
				set(documentAtoms, document, identity) // TODO -- possible to avoid "bumping" a state to get picked up by a timeline?
			},
		})

		const documentTimeline = timeline({
			key: `documentTimeline`,
			scope: [documentAtoms],
		})
		const createDocument = runTransaction(createDocumentTX)
		const deleteDocument = runTransaction(deleteDocumentTX)
		const transferDocument = runTransaction(transferDocumentTX)

		documentRealm.allocate(`root`, `userGroup::homies`)
		const documentClaim = createDocument(`userGroup::homies`, 1)

		expect(IMPLICIT.STORE.molecules.size).toBe(3)
		deleteDocument(documentClaim)

		expect(IMPLICIT.STORE.molecules.size).toBe(2)
		undo(documentTimeline)
		expect(IMPLICIT.STORE.molecules.size).toBe(3)
		undo(documentTimeline)
		expect(IMPLICIT.STORE.molecules.size).toBe(2)
		redo(documentTimeline)
		expect(IMPLICIT.STORE.molecules.size).toBe(3)
		redo(documentTimeline)
		expect(IMPLICIT.STORE.molecules.size).toBe(2)
		documentRealm.allocate(`root`, `userGroup::workPals`)
		expect(IMPLICIT.STORE.molecules.size).toBe(3)
		documentRealm.allocate(`userGroup::homies`, `document::${2}`)
		expect(IMPLICIT.STORE.molecules.size).toBe(4)
		const homiesConfiguration = new Map([
			[`"document::2":"userGroup::homies"`, { source: `"userGroup::homies"` }],
			[`"root":"userGroup::homies"`, { source: `"root"` }],
			[`"root":"userGroup::workPals"`, { source: `"root"` }],
		])
		expect(IMPLICIT.STORE.moleculeGraph.contents).toEqual(homiesConfiguration)
		transferDocument({ to: [`userGroup::workPals`], document: `document::${2}` })
		const workPalsConfiguration = new Map([
			[
				`"document::2":"userGroup::workPals"`,
				{ source: `"userGroup::workPals"` },
			],

			[`"root":"userGroup::homies"`, { source: `"root"` }],
			[`"root":"userGroup::workPals"`, { source: `"root"` }],
		])
		expect(IMPLICIT.STORE.moleculeGraph.contents).toEqual(workPalsConfiguration)
		undo(documentTimeline)
		expect(IMPLICIT.STORE.moleculeGraph.contents).toEqual(homiesConfiguration)

		documentRealm.deallocate(`userGroup::workPals`)
		documentRealm.deallocate(`document::${2}`)
		documentRealm.allocate(`root`, `user::joe`)
		documentRealm.allocate(`root`, `user::deb`)
		documentRealm.allocate(`root`, `user::sue`)
		documentRealm.allocate(`userGroup::homies`, `document::${3}`)

		transferDocument({
			to: [`user::deb`, `user::joe`],
			document: `document::${3}`,
		})
		documentRealm.deallocate(`userGroup::homies`)
		const debAndJoeConfiguration = new Map([
			[`"root":"user::joe"`, { source: `"root"` }],
			[`"root":"user::deb"`, { source: `"root"` }],
			[`"root":"user::sue"`, { source: `"root"` }],
			[`"document::3":"user::deb"`, { source: `"user::deb"` }],
			[`"document::3":"user::joe"`, { source: `"user::joe"` }],
		])
		expect(IMPLICIT.STORE.moleculeGraph.contents).toEqual(debAndJoeConfiguration)
		transferDocument({
			to: [`user::sue`],
			document: `document::${3}`,
		})
		const sueConfiguration = new Map([
			[`"root":"user::joe"`, { source: `"root"` }],
			[`"root":"user::deb"`, { source: `"root"` }],
			[`"root":"user::sue"`, { source: `"root"` }],
			[`"document::3":"user::sue"`, { source: `"user::sue"` }],
		])
		expect(IMPLICIT.STORE.moleculeGraph.contents).toEqual(sueConfiguration)
		undo(documentTimeline)
		expect(IMPLICIT.STORE.moleculeGraph.contents).toEqual(debAndJoeConfiguration)
		redo(documentTimeline)
		expect(IMPLICIT.STORE.moleculeGraph.contents).toEqual(sueConfiguration)
	})
	test(`join supports allocation pattern`, () => {
		const roomPlayers = join({
			key: `roomPlayers`,
			between: [`room`, `user`],
			cardinality: `1:1`,
			isAType: (input): input is `room::arena` | `room::lobby` =>
				[`room::lobby`, `room::arena`].includes(input),
			isBType: (input): input is `user::joshua` => input === `user::joshua`,
		})
		const anarchy = new Anarchy()
		anarchy.allocate(`root`, `user::joshua`)
		anarchy.allocate(`root`, `room::lobby`)

		expect([...IMPLICIT.STORE.molecules.keys()]).toEqual([
			`"root"`,
			`"user::joshua"`,
			`"room::lobby"`,
		])
		expect(IMPLICIT.STORE.valueMap.size).toBe(0)

		editRelations(roomPlayers, (relations) => {
			relations.set(`room::lobby`, `user::joshua`)
		})
		anarchy.fuse(`player`, `user::joshua`, `room::lobby`)
		expect(IMPLICIT.STORE.molecules.size).toBe(4)
		expect(IMPLICIT.STORE.moleculeGraph.relations.size).toBe(4)
		expect(IMPLICIT.STORE.valueMap.size).toBe(4)

		anarchy.deallocate(`T$--player==user::joshua++room::lobby`)

		const room = getState(
			findRelations(roomPlayers, `user::joshua`).roomKeyOfUser,
		)
		expect(room).toEqual(null)

		expect(IMPLICIT.STORE.molecules.size).toBe(3)
		expect(IMPLICIT.STORE.moleculeGraph.relations.size).toBe(3)
		expect(IMPLICIT.STORE.valueMap.size).toBe(5)

		anarchy.deallocate(`room::lobby`)

		expect(IMPLICIT.STORE.molecules.size).toBe(2)
		expect(IMPLICIT.STORE.moleculeGraph.relations.size).toBe(2)
		expect(IMPLICIT.STORE.valueMap.size).toBe(3)
	})
})

describe(`decomposeCompound`, () => {
	test(`decomposes compound keys`, () => {
		const components = decomposeCompound(`T$--player==user::joshua++room::lobby`)
		assert(components)
		const [type, a, b] = components
		expect(type).toBe(`player`)
		expect(a).toBe(`user::joshua`)
		expect(b).toBe(`room::lobby`)
	})
	test(`returns null if the key is not a compound`, () => {
		const components0 = decomposeCompound(`my-key`)
		expect(components0).toBe(null)
		const components1 = decomposeCompound(`T$--player==user::joshua++`)
		expect(components1).toBe(null)
		const components2 = decomposeCompound(`T$--player==user::joshua`)
		expect(components2).toBe(null)
	})
})

describe(`counterfeits and error logging`, () => {
	test(`logs an error when a disposed state is set`, () => {
		const anarchy = new Anarchy()
		const priceAtoms = atomFamily<number, string>({
			key: `price`,
			default: 0,
		})
		anarchy.allocate(`root`, `item1`)
		setState(priceAtoms, `item1`, 10)
		anarchy.deallocate(`item1`)
		expect(logger.warn).not.toHaveBeenCalled()
		expect(logger.error).not.toHaveBeenCalled()
		setState(priceAtoms, `item1`, 20)
		expect(logger.warn).toHaveBeenCalledTimes(1)
		expect(logger.error).toHaveBeenCalledTimes(1)
	})
})
