import { randomUUID } from "node:crypto"

import type { Above, Below, Hierarchy, Logger, Mutuals, Vassal } from "atom.io"
import {
	atomFamily,
	disposeState,
	getState,
	realm,
	redo,
	runTransaction,
	setState,
	T$,
	timeline,
	transaction,
	undo,
} from "atom.io"
import { clearStore, IMPLICIT } from "atom.io/internal"

const LOG_LEVELS = [null, `error`, `warn`, `info`] as const
const CHOOSE = 2

let logger: Logger

beforeEach(() => {
	clearStore(IMPLICIT.STORE)
	IMPLICIT.STORE.config.lifespan = `immortal`
	IMPLICIT.STORE.loggers[0].logLevel = LOG_LEVELS[CHOOSE]
	logger = IMPLICIT.STORE.logger
	vitest.spyOn(logger, `error`)
	vitest.spyOn(logger, `warn`)
	vitest.spyOn(logger, `info`)
})
describe(`allocate`, () => {
	test(`the Hierarchy + allocate + claim pattern`, () => {
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
					style: `all`
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

		const durabilityAtoms = atomFamily<number, ItemKey>({
			key: `durability`,
			default: 0,
		})

		const gameKey = `game::xxx` satisfies GameKey
		const userKey = `user::yyy` satisfies UserKey
		const playerKey = `T$--player==${gameKey}++${userKey}` satisfies PlayerKey
		const swordKey = `item::sword` satisfies ItemKey
		const shieldKey = `item::shield` satisfies ItemKey

		expect(logger.error).toHaveBeenCalledTimes(0)
		let myItemDurability = getState(durabilityAtoms, swordKey)
		expect(logger.error).toHaveBeenCalledTimes(2)
		expect(myItemDurability).toBe(0)
		setState(durabilityAtoms, swordKey, 35)
		expect(logger.error).toHaveBeenCalledTimes(4)
		myItemDurability = getState(durabilityAtoms, swordKey)
		expect(logger.error).toHaveBeenCalledTimes(6)
		expect(myItemDurability).toBe(0)

		const gameRealm = realm<GameHierarchy>(IMPLICIT.STORE)

		const gameClaim = gameRealm.allocate(`root`, gameKey)
		const userClaim = gameRealm.allocate(`root`, userKey)
		const playerClaim = gameRealm.allocate([gameClaim, userClaim], playerKey)
		const swordClaim = gameRealm.allocate(playerClaim, swordKey)
		const shieldClaim = gameRealm.allocate(gameClaim, shieldKey)

		myItemDurability = getState(durabilityAtoms, swordClaim)
		expect(logger.error).toHaveBeenCalledTimes(6)
		expect(myItemDurability).toBe(0)
		setState(durabilityAtoms, swordClaim, 35)

		myItemDurability = getState(durabilityAtoms, swordClaim)
		expect(logger.error).toHaveBeenCalledTimes(6)
		expect(myItemDurability).toBe(35)

		disposeState(durabilityAtoms, swordClaim)

		myItemDurability = getState(durabilityAtoms, swordClaim)
		expect(logger.error).toHaveBeenCalledTimes(6)
		expect(myItemDurability).toBe(0)

		gameRealm.deallocate(gameClaim)

		console.log(IMPLICIT.STORE.molecules)

		gameRealm.allocate(playerClaim, `item::aaa`)
		gameRealm.allocate(gameClaim, `item::aaa`)
		gameRealm.allocate(
			[gameClaim, userClaim],
			`T$--player==${gameKey}++${userKey}`,
		)
	})
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
		const { allocate, deallocate } = realm<DocumentHierarchy>(IMPLICIT.STORE)

		const documentAtoms = atomFamily<string, DocumentKey>({
			key: `doc`,
			default: ``,
		})

		const createDocumentTX = transaction<
			(owner: UserGroupKey | UserKey) => DocumentKey
		>({
			key: `createDocument`,
			do: ({ set }, owner) => {
				const documentKey = `document::${randomUUID()}` satisfies DocumentKey
				allocate(owner, documentKey)
				set(documentAtoms, documentKey, `hello work!`)
				return documentKey
			},
		})
		const deleteDocumentTX = transaction<(document: DocumentKey) => void>({
			key: `deleteDocument`,
			do: (_, document) => {
				deallocate(document)
			},
		})

		const documentTimeline = timeline({
			key: `documentTimeline`,
			scope: [documentAtoms],
		})
		const createDocument = runTransaction(createDocumentTX)
		const deleteDocument = runTransaction(deleteDocumentTX)

		allocate(`root`, `userGroup::homies`)
		const documentClaim = createDocument(`userGroup::homies`)
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
	})
})
