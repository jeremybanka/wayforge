import { join } from "atom.io/data"
import { vitest } from "vitest"

import { getState, runTransaction, subscribe, transaction } from "atom.io"
import type { Logger } from "atom.io"

import * as Internal from "atom.io/internal"
import { desc } from "drizzle-orm"
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

describe(`join with content`, () => {
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
		expect(roomPlayers.relations.has(`josh`)).toBe(false)
		expect(roomPlayers.relations.has(`josh`, `lobby`)).toBe(false)
		expect(roomPlayers.relations.has(`joshua`)).toBe(true)
		expect(roomPlayers.relations.has(`joshua`, `lobby`)).toBe(true)
		expect(roomPlayers.relations.getContent(`joshua`, `lobby`)).toEqual({
			joinedAt,
		})

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

		roomPlayers.relations.delete({ player: `joshua`, room: `lobby` })

		expect(getState(lobbyPlayersState)).toEqual([])
		expect(getState(joshuaRoomsState)).toEqual([])
	})
})

describe(`join with no content`, () => {
	test(`supports 1:1 relations`, () => {
		const roomPlayers = join({
			key: `roomPlayers`,
			between: [`room`, `player`],
			cardinality: `1:1`,
		})
		const lobbyPlayerState = roomPlayers.findState.playerKeyOfRoom(`lobby`)
		const joshuaRoomState = roomPlayers.findState.roomKeyOfPlayer(`joshua`)

		const arenaPlayerState = roomPlayers.findState.playerKeyOfRoom(`arena`)

		subscribe(arenaPlayerState, Utils.stdout)

		subscribe(lobbyPlayerState, Utils.stdout0)
		subscribe(joshuaRoomState, Utils.stdout1)

		roomPlayers.relations.set({ player: `joshua`, room: `lobby` })

		expect(Utils.stdout).toHaveBeenCalledTimes(0)
		expect(Utils.stdout0).toHaveBeenCalledWith({
			oldValue: undefined,
			newValue: `joshua`,
		})
		expect(Utils.stdout1).toHaveBeenCalledWith({
			oldValue: undefined,
			newValue: `lobby`,
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

	test(`replacing relations`, () => {
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
		userGroups.relations.replaceRelations(`a`, [`2`, `3`])
		expect(getState(userGroups.findState.groupKeysOfUser(`a`))).toEqual([
			`2`,
			`3`,
		])
		expect(getState(userGroups.findState.groupKeysOfUser(`1`))).toEqual([])
		expect(getState(userGroups.findState.userKeysOfGroup(`2`))).toEqual([
			`c`,
			`a`,
		])
		expect(getState(userGroups.findState.userKeysOfGroup(`3`))).toEqual([
			`b`,
			`a`,
		])
	})
})

describe(`advanced performance tests`, () => {
	const ITERATION_COUNTS = [2, 4, 8, 16, 32, 64, 128, 256, 512] as const

	function sigFigs(sigFigs: number, num: number): number {
		if (num === 0) {
			return 0
		}

		const magnitude = Math.floor(Math.log10(Math.abs(num)))
		const scale = 10 ** (sigFigs - magnitude - 1)

		return Math.round(num * scale) / scale
	}
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
			let basicTime = Utils.time(`loopingBasic:` + count, () => {
				runTransaction(loopingBasicTX)(count)
			}).duration
			reset()
			let safeTime = Utils.time(`loopingBasic:` + count, () => {
				runTransaction(loopingSafeReplacementTX)(count)
			}).duration
			reset()
			let unsafeTime = Utils.time(`loopingBasic:` + count, () => {
				runTransaction(loopingUnsafeReplacementTX)(count)
			}).duration
			const minTime = Math.min(basicTime, safeTime, unsafeTime)
			const basicRatio = basicTime / minTime
			const safeRatio = safeTime / minTime
			const unsafeRatio = safeTime / minTime
			basicTime -= minTime
			safeTime -= minTime
			unsafeTime -= minTime
			const winner = `✅ (${sigFigs(2, minTime)}ms)`
			return {
				count,
				basic: basicTime === 0 ? winner : `❌ ${sigFigs(1, basicRatio)}`,
				safe: safeTime === 0 ? winner : `❌ ${sigFigs(1, safeRatio)}`,
				unsafe: unsafeTime === 0 ? winner : `❌ ${sigFigs(1, unsafeRatio)}`,
			}
		})
		console.table(results)
	})
})
