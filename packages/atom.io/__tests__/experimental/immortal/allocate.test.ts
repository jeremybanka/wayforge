import type { Logger } from "atom.io"
import { clearStore, IMPLICIT } from "atom.io/internal"

import type {
	Above,
	Below,
	Claim,
	Hierarchy,
	SingularTypedKey,
	TypedKey,
	Vassal,
} from "~/packages/atom.io/src/allocate"
import {
	allocateIntoStore,
	createAllocator,
	T$,
} from "~/packages/atom.io/src/allocate"

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

		const gameKey = [`game`, `xxx`] satisfies GameKey
		const userKey = [`user`, `yyy`] satisfies UserKey
		const playerKey = [[T$, `player`], gameKey, userKey] satisfies PlayerKey
		const itemKey = [`item`, `zzz`] as [`item`, string]

		const gameAllocator = createAllocator<GameHierarchy>(IMPLICIT.STORE)

		const gameClaim = gameAllocator(`root`, gameKey)
		const userClaim = gameAllocator(`root`, userKey)
		const playerClaim = gameAllocator([gameClaim, userClaim], playerKey)
		const itemClaim = gameAllocator(playerClaim, itemKey)
	})
})
