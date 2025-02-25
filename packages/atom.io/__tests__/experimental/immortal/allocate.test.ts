import type { Above, Below, Hierarchy, Logger, Mutuals, Vassal } from "atom.io"
import {
	Anarchy,
	atom,
	atomFamily,
	disposeState,
	editRelations,
	getState,
	join,
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

		expect(logger.error).toHaveBeenCalledTimes(0)
		let myItemDurability = getState(durabilityAtoms, swordKey)
		expect(logger.error).toHaveBeenCalledTimes(2)
		expect(myItemDurability).toBe(0)
		setState(durabilityAtoms, swordKey, 35)
		expect(logger.error).toHaveBeenCalledTimes(4)
		myItemDurability = getState(durabilityAtoms, swordKey)
		expect(logger.error).toHaveBeenCalledTimes(6)
		expect(myItemDurability).toBe(0)
		const myDampenedDurability = getState(dampenedDurabilitySelectors, swordKey)
		expect(myDampenedDurability).toBe(1)
		expect(logger.error).toHaveBeenCalledTimes(10)
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
})
describe(`integrations`, () => {
	test(`transaction+timeline support`, () => {
		type DocumentKey = `document::${string}`
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
			key: `doc`,
			default: ``,
		})

		const createDocumentTX = transaction<
			(owner: UserGroupKey | UserKey, id: string) => DocumentKey
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
				to: UserGroupKey
				document: DocumentKey
			}) => void
		>({
			key: `transferDocument`,
			do: ({ set }, { to, document }) => {
				documentRealm.claim(to, document, `exclusive`)
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
		const documentClaim = createDocument(`userGroup::homies`, `1`)

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
		documentRealm.allocate(`userGroup::homies`, `document::work`)
		expect(IMPLICIT.STORE.molecules.size).toBe(4)
		const homiesConfiguration = new Map([
			[
				`"document::work":"userGroup::homies"`,
				{ source: `"userGroup::homies"` },
			],
			[`"root":"userGroup::homies"`, { source: `"root"` }],
			[`"root":"userGroup::workPals"`, { source: `"root"` }],
		])
		expect(IMPLICIT.STORE.moleculeGraph.contents).toEqual(homiesConfiguration)
		transferDocument({ to: `userGroup::workPals`, document: `document::work` })
		const workPalsConfiguration = new Map([
			[
				`"document::work":"userGroup::workPals"`,
				{ source: `"userGroup::workPals"` },
			],

			[`"root":"userGroup::homies"`, { source: `"root"` }],
			[`"root":"userGroup::workPals"`, { source: `"root"` }],
		])
		expect(IMPLICIT.STORE.moleculeGraph.contents).toEqual(workPalsConfiguration)
		undo(documentTimeline)
		expect(IMPLICIT.STORE.moleculeGraph.contents).toEqual(homiesConfiguration)
	})
	test(`join supports allocation pattern`, () => {
		const roomPlayers = join(
			{
				key: `roomPlayers`,
				between: [`room`, `player`],
				cardinality: `1:1`,
				isAType: (input): input is `arena` | `lobby` =>
					[`lobby`, `arena`].includes(input),
				isBType: (input): input is `joshua` => input === `joshua`,
			},
			{ joinedAt: Number.NaN },
		)
		const anarchy = new Anarchy()
		anarchy.allocate(`root`, `joshua`)
		anarchy.allocate(`root`, `lobby`)

		expect([...IMPLICIT.STORE.molecules.keys()]).toEqual([
			`"root"`,
			`"roomPlayers"`,
			`"joshua"`,
			`"lobby"`,
		])
		expect(IMPLICIT.STORE.valueMap.size).toBe(0)

		editRelations(roomPlayers, (relations) => {
			relations.set(
				{ player: `joshua`, room: `lobby` },
				{ joinedAt: Date.now() },
			)
		})
		expect(IMPLICIT.STORE.molecules.size).toBe(5)
		expect(IMPLICIT.STORE.moleculeGraph.relations.size).toBe(5)
		expect(IMPLICIT.STORE.valueMap.size).toBe(5)
		anarchy.deallocate(`lobby`)
		expect(IMPLICIT.STORE.molecules.size).toBe(3)
		expect(IMPLICIT.STORE.moleculeGraph.relations.size).toBe(3)
		expect(IMPLICIT.STORE.valueMap.size).toBe(2)
	})
})
