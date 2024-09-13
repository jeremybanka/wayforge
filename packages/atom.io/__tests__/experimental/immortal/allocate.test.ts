import type { CtorToolkit, Logger } from "atom.io"
import {
	atomFamily,
	disposeState,
	getState,
	makeMolecule,
	makeRootMoleculeInStore,
	moleculeFamily,
	RegularAtomToken,
	transaction,
} from "atom.io"
import { clearStore, IMPLICIT, withdraw } from "atom.io/internal"

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

		const gameWorld = createWorld<GameHierarchy>(IMPLICIT.STORE)

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

// describe(`integration with the molecule family pattern`, () => {
// 	test(`stage 0: all molecules from families`, () => {
// 		const root = makeRootMoleculeInStore(`root`)

// 		const nameState = atomFamily<string, string>({
// 			key: `name`,
// 			default: `NO_NAME`,
// 		})

// 		class GameState {
// 			public constructor(
// 				bond: CtorToolkit<string>[`bond`],
// 				public name = bond(nameState),
// 			) {}
// 		}
// 		const gameMolecules = moleculeFamily({
// 			key: `game`,
// 			new: class Game {
// 				public state: GameState
// 				public constructor(
// 					public tools: CtorToolkit<string>,
// 					public key: string,
// 				) {
// 					this.state = new GameState(tools.bond)
// 				}
// 			},
// 		})

// 		class UserState {
// 			public constructor(
// 				bond: CtorToolkit<string>[`bond`],
// 				public name = bond(nameState),
// 			) {}
// 		}
// 		const userMolecules = moleculeFamily({
// 			key: `user`,
// 			new: class User {
// 				public state: UserState
// 				public constructor(
// 					public tools: CtorToolkit<string>,
// 					public key: string,
// 				) {
// 					this.state = new UserState(tools.bond)
// 				}

// 				public joinGame(gameKey: string) {
// 					const game = getState(gameMolecules, gameKey)
// 					if (!game) {
// 						throw new Error(`Game ${gameKey} not found`)
// 					}
// 					const player = game.tools.spawn(playerMolecules, this.key)
// 					this.tools.claim(player, { exclusive: false })
// 				}
// 			},
// 		})

// 		class PlayerState {
// 			public constructor(
// 				bond: CtorToolkit<string>[`bond`],
// 				public name = bond(nameState),
// 			) {}
// 		}
// 		const playerMolecules = moleculeFamily({
// 			key: `player`,
// 			new: class Player {
// 				public state: PlayerState
// 				public constructor(
// 					tools: CtorToolkit<string>,
// 					public key: string,
// 				) {
// 					this.state = new PlayerState(tools.bond)
// 				}
// 			},
// 		})
// 	})
// 	test(`stage 1: all molecules from families`, () => {
// 		const gameWorld = createWorld<
// 			[
// 				{
// 					above: any
// 					below: any[]
// 				},
// 			]
// 		>(IMPLICIT.STORE, `game`)

// 		const bottomMolecules = moleculeFamily({
// 			key: `bottom`,
// 			dependsOn: `any`,
// 			new: class Bottom {},
// 		})

// 		const topMolecules = moleculeFamily({
// 			key: `top`,
// 			new: class Top {
// 				public constructor(
// 					tools: CtorToolkit<string>,
// 					public key: string,
// 					childKeys: string[],
// 				) {
// 					for (const childKey of childKeys) {
// 						const child = tools.seek(bottomMolecules, childKey)
// 						if (child) {
// 							tools.claim(child, { exclusive: true })
// 						} else {
// 							tools.spawn(bottomMolecules, childKey)
// 						}
// 					}
// 				}
// 			},
// 		})

// 		const aMolecule0 = makeMolecule(gameWorld.root, topMolecules, `a0`, [`a`])

// 		const aMolecule1 = makeMolecule(gameWorld.root, topMolecules, `a1`, [`a`])

// 		expect(IMPLICIT.STORE.molecules.size).toBe(4)
// 		const a0 = withdraw(aMolecule0, IMPLICIT.STORE)
// 		const a1 = withdraw(aMolecule1, IMPLICIT.STORE)
// 		expect(a0?.below.size).toBe(0)
// 		expect(a1?.below.size).toBe(1)

// 		gameWorld.allocate(`root`, [`a0`, `a1`])

// 		disposeState(aMolecule0)
// 		expect(IMPLICIT.STORE.molecules.size).toBe(3)

// 		disposeState(aMolecule1)
// 		expect(IMPLICIT.STORE.molecules.size).toBe(1)
// 	})
// })
