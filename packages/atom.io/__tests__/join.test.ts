import { join } from "atom.io/data"
import { vitest } from "vitest"

import { getState, runTransaction, subscribe, transaction } from "atom.io"
import type { Logger } from "atom.io"

import * as Internal from "atom.io/internal"
import * as Utils from "./__util__"

const LOG_LEVELS = [null, `error`, `warn`, `info`] as const
const CHOOSE = 2

let logger: Logger

beforeEach(() => {
	Internal.clearStore(Internal.IMPLICIT.STORE)
	Internal.IMPLICIT.STORE.loggers[0].logLevel = LOG_LEVELS[CHOOSE]
	logger = Internal.IMPLICIT.STORE.logger
	vitest.spyOn(logger, `error`)
	vitest.spyOn(logger, `warn`)
	vitest.spyOn(logger, `info`)
	vitest.spyOn(Utils, `stdout`)
	vitest.spyOn(Utils, `stdout0`)
	vitest.spyOn(Utils, `stdout1`)
	vitest.spyOn(Utils, `stdout2`)
	vitest.spyOn(Utils, `stdout3`)
})

describe(`join`, () => {
	test(`supports 1:1 relations`, () => {
		const roomPlayers = join(
			{
				key: `roomPlayers`,
				between: [`room`, `player`],
				cardinality: `1:1`,
			},
			{ joinedAt: NaN },
		)
		const lobbyPlayerState = roomPlayers.findState.playerKeyOfRoom(`lobby`)
		const joshuaRoomState = roomPlayers.findState.roomKeyOfPlayer(`joshua`)

		const arenaPlayerState = roomPlayers.findState.playerKeyOfRoom(`arena`)

		const lobbyPlayerEntryState =
			roomPlayers.findState.playerEntryOfRoom(`lobby`)
		const joshuaRoomEntryState =
			roomPlayers.findState.roomEntryOfPlayer(`joshua`)

		subscribe(arenaPlayerState, Utils.stdout)

		subscribe(lobbyPlayerState, Utils.stdout0)
		subscribe(joshuaRoomState, Utils.stdout1)

		subscribe(lobbyPlayerEntryState, Utils.stdout2)
		subscribe(joshuaRoomEntryState, Utils.stdout3)

		const joinedAt = Date.now()

		roomPlayers.relations.set({ player: `joshua`, room: `lobby` }, { joinedAt })

		expect(Utils.stdout).toHaveBeenCalledTimes(0)
		expect(Utils.stdout0).toHaveBeenCalledWith({
			oldValue: undefined,
			newValue: `joshua`,
		})
		expect(Utils.stdout1).toHaveBeenCalledWith({
			oldValue: undefined,
			newValue: `lobby`,
		})
		expect(Utils.stdout2).toHaveBeenCalledWith({
			oldValue: undefined,
			newValue: [`joshua`, { joinedAt }],
		})
		expect(Utils.stdout3).toHaveBeenCalledWith({
			oldValue: undefined,
			newValue: [`lobby`, { joinedAt }],
		})
	})
	test(`supports 1:n relations`, () => {
		const roomPlayers = join(
			{
				key: `playersInRooms`,
				between: [`room`, `player`],
				cardinality: `1:n`,
			},
			{ joinedAt: NaN },
		)
		const lobbyPlayersState = roomPlayers.findState.playerKeysOfRoom(`lobby`)
		const joshuaRoomState = roomPlayers.findState.roomKeyOfPlayer(`joshua`)
		const lobbyPlayerEntriesState =
			roomPlayers.findState.playerEntriesOfRoom(`lobby`)
		const joshuaRoomEntryState =
			roomPlayers.findState.roomEntryOfPlayer(`joshua`)

		subscribe(lobbyPlayersState, Utils.stdout0)
		subscribe(joshuaRoomState, Utils.stdout1)
		subscribe(lobbyPlayerEntriesState, Utils.stdout2)
		subscribe(joshuaRoomEntryState, Utils.stdout3)

		const joinedAt = Date.now()

		roomPlayers.relations.set({ player: `joshua`, room: `lobby` }, { joinedAt })

		expect(Utils.stdout0).toHaveBeenCalledWith({
			oldValue: [],
			newValue: [`joshua`],
		})
		expect(Utils.stdout1).toHaveBeenCalledWith({
			oldValue: undefined,
			newValue: `lobby`,
		})
		expect(Utils.stdout2).toHaveBeenCalledWith({
			oldValue: [],
			newValue: [[`joshua`, { joinedAt }]],
		})
		expect(Utils.stdout3).toHaveBeenCalledWith({
			oldValue: undefined,
			newValue: [`lobby`, { joinedAt }],
		})
	})
	test(`supports n:n relations`, () => {
		const roomPlayers = join(
			{
				key: `playersInRooms`,
				between: [`room`, `player`],
				cardinality: `n:n`,
			},
			{ joinedAt: NaN },
		)
		const lobbyPlayersState = roomPlayers.findState.playerKeysOfRoom(`lobby`)
		const joshuaRoomsState = roomPlayers.findState.roomKeysOfPlayer(`joshua`)
		const lobbyPlayerEntriesState =
			roomPlayers.findState.playerEntriesOfRoom(`lobby`)
		const joshuaRoomsEntriesState =
			roomPlayers.findState.roomEntriesOfPlayer(`joshua`)

		subscribe(lobbyPlayersState, Utils.stdout0)
		subscribe(joshuaRoomsState, Utils.stdout1)
		subscribe(lobbyPlayerEntriesState, Utils.stdout2)
		subscribe(joshuaRoomsEntriesState, Utils.stdout3)

		const joinedAt = Date.now()

		roomPlayers.relations.set({ player: `joshua`, room: `lobby` }, { joinedAt })

		expect(Utils.stdout0).toHaveBeenCalledWith({
			oldValue: [],
			newValue: [`joshua`],
		})
		expect(Utils.stdout1).toHaveBeenCalledWith({
			oldValue: [],
			newValue: [`lobby`],
		})
		expect(Utils.stdout2).toHaveBeenCalledWith({
			oldValue: [],
			newValue: [[`joshua`, { joinedAt }]],
		})
		expect(Utils.stdout3).toHaveBeenCalledWith({
			oldValue: [],
			newValue: [[`lobby`, { joinedAt }]],
		})
	})
})

describe(`some practical use cases`, () => {
	test(`setting relations in a transaction that fails`, () => {
		const cardValues = join({
			key: `cardValues`,
			between: [`value`, `card`],
			cardinality: `1:n`,
		})
		const failingTX = transaction<() => void>({
			key: `laborious`,
			do: () => {
				for (let i = 0; i < 100; i++) {
					cardValues.relations.set({ value: `a`, card: `${i}` })
					if (i === 99) {
						throw new Error(`whoops!`)
					}
				}
			},
		})
		let caught: Error | undefined
		try {
			runTransaction(failingTX)()
		} catch (thrown) {
			if (thrown instanceof Error) caught = thrown
		}
		expect(caught).toBeInstanceOf(Error)
		expect(getState(cardValues.findState.cardKeysOfValue(`a`))).toEqual([])
	})

	test(`initializing a join from serialized junction data`, () => {
		const userGroups = join({
			key: `userGroups`,
			between: [`user`, `group`],
			cardinality: `n:n`,
			relations: [
				[`a`, [`1`]],
				[`b`, [`3`]],
				[`c`, [`2`]],
			],
		})
		expect(getState(userGroups.findState.groupKeysOfUser(`a`))).toEqual([`1`])
		expect(getState(userGroups.findState.groupKeysOfUser(`b`))).toEqual([`3`])
		expect(getState(userGroups.findState.groupKeysOfUser(`c`))).toEqual([`2`])
		expect(getState(userGroups.findState.userKeysOfGroup(`1`))).toEqual([`a`])
		expect(getState(userGroups.findState.userKeysOfGroup(`2`))).toEqual([`c`])
		expect(getState(userGroups.findState.userKeysOfGroup(`3`))).toEqual([`b`])
	})
})

describe(`advanced performance tests`, () => {
	const ITERATION_COUNTS = [2, 4, 8, 16, 32, 64, 128, 256, 512, 1024] as const
	test(`setting many relations at once with iteration`, () => {
		function createCardValues() {
			return join({
				key: `cardValues`,
				between: [`value`, `card`],
				cardinality: `1:n`,
			})
		}
		function createBasicTX() {
			return transaction<(count: number) => void>({
				key: `loopingBasic`,
				do: (_, count) => {
					for (let i = 0; i < count; i++) {
						cardValues.relations.set({ value: `a`, card: `${i}` })
					}
				},
			})
		}
		function createLoopingSafeReplacementTX() {
			return transaction<(count: number) => void>({
				key: `loopingSafeReplacement`,
				do: (_, count) => {
					const relations: string[] = []
					for (let i = 0; i < count; i++) {
						relations.push(String(i))
					}
					cardValues.relations.replaceRelations(`a`, relations)
				},
			})
		}
		function createLoopingUnsafeReplacementTX() {
			return transaction<(count: number) => void>({
				key: `loopingUnsafeReplacement`,
				do: (_, count) => {
					const relations: string[] = []
					for (let i = 0; i < count; i++) {
						relations.push(String(i))
					}
					cardValues.relations.replaceRelations(`a`, relations, {
						reckless: true,
					})
				},
			})
		}
		let cardValues = createCardValues()
		let loopingBasicTX = createBasicTX()
		let loopingSafeReplacementTX = createLoopingSafeReplacementTX()
		let loopingUnsafeReplacementTX = createLoopingUnsafeReplacementTX()
		function reset() {
			Internal.clearStore(Internal.IMPLICIT.STORE)
			cardValues = createCardValues()
			loopingBasicTX = createBasicTX()
			loopingSafeReplacementTX = createLoopingSafeReplacementTX()
			loopingUnsafeReplacementTX = createLoopingUnsafeReplacementTX()
		}
		const results = ITERATION_COUNTS.map((count) => {
			reset()
			const basic = Number(
				Utils.time(`loopingBasic:` + count, () => {
					runTransaction(loopingBasicTX)(count)
				}).duration.toPrecision(3),
			)
			reset()
			const safe = Number(
				Utils.time(`loopingBasic:` + count, () => {
					runTransaction(loopingSafeReplacementTX)(count)
				}).duration.toPrecision(3),
			)
			reset()
			const unsafe = Number(
				Utils.time(`loopingBasic:` + count, () => {
					runTransaction(loopingUnsafeReplacementTX)(count)
				}).duration.toPrecision(3),
			)
			return { count, basic, safe, unsafe }
		})
		console.table(results)
		type Iteration = (typeof ITERATION_COUNTS)[number]
		type IterationStats = Record<Iteration, number>
		type Data = Record<`basic` | `safe` | `unsafe`, IterationStats>
		const data = results.reduce<Data>(
			(data, { count, basic, safe, unsafe }) => {
				data.basic[count] = basic
				data.safe[count] = safe
				data.unsafe[count] = unsafe
				return data
			},
			{
				basic: {} as IterationStats,
				safe: {} as IterationStats,
				unsafe: {} as IterationStats,
			},
		)
		function expectOrder(...numbers: number[]) {
			for (let i = 0; i < numbers.length - 1; i++) {
				expect(numbers[i]).toBeLessThan(numbers[i + 1])
			}
		}
	})
})
