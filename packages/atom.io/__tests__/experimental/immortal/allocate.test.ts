import { atomFamily, disposeState, getState, type Logger } from "atom.io"
import { clearStore, IMPLICIT } from "atom.io/internal"

import type {
	Above,
	Below,
	Hierarchy,
	Mutuals,
	Vassal,
} from "~/packages/atom.io/src/allocate"
import { createWorld, T$ } from "~/packages/atom.io/src/allocate"

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
		type GameKey = [`game`, string]
		type UserKey = [`user`, string]
		type PlayerKey = [[T$, `player`], GameKey, UserKey]
		type ItemKey = [`item`, string]

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

		const gameKey = [`game`, `xxx`] satisfies GameKey
		const userKey = [`user`, `yyy`] satisfies UserKey
		const playerKey = [[T$, `player`], gameKey, userKey] satisfies PlayerKey
		const itemKey = [`item`, `zzz`] as [`item`, string]

		const myItemDurability0 = getState(durabilityAtoms, itemKey)

		const gameWorld = createWorld<GameHierarchy>(IMPLICIT.STORE, `gameWorld`)

		const gameClaim = gameWorld.allocate(`root`, gameKey)
		const userClaim = gameWorld.allocate(`root`, userKey)
		const playerClaim = gameWorld.allocate([gameClaim, userClaim], playerKey)
		const itemClaim = gameWorld.allocate(playerClaim, itemKey)

		console.log(IMPLICIT.STORE.molecules)

		const myItemDurability = getState(durabilityAtoms, itemClaim)

		disposeState(durabilityAtoms, itemClaim)

		console.log(myItemDurability)
	})
})
