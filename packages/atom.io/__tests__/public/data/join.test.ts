import {
	editRelations,
	findRelations,
	getInternalRelations,
	join,
} from "atom.io/data"
import { vitest } from "vitest"

import { getState, runTransaction, subscribe, transaction } from "atom.io"
import type { Logger } from "atom.io"

import * as Internal from "atom.io/internal"
import * as Utils from "../../__util__"

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
		const lobbyPlayerState = findRelations(roomPlayers, `lobby`).playerKeyOfRoom
		const joshuaRoomState = findRelations(roomPlayers, `joshua`).roomKeyOfPlayer

		const arenaPlayerState = findRelations(roomPlayers, `arena`).playerKeyOfRoom

		const lobbyPlayerEntryState = findRelations(
			roomPlayers,
			`lobby`,
		).playerEntryOfRoom
		const joshuaRoomEntryState = findRelations(
			roomPlayers,
			`joshua`,
		).roomEntryOfPlayer

		subscribe(arenaPlayerState, Utils.stdout)

		subscribe(lobbyPlayerState, Utils.stdout0)
		subscribe(joshuaRoomState, Utils.stdout1)

		subscribe(lobbyPlayerEntryState, Utils.stdout2)
		subscribe(joshuaRoomEntryState, Utils.stdout3)

		const joinedAt = Date.now()

		editRelations(roomPlayers, (relations) => {
			relations.set({ player: `joshua`, room: `lobby` }, { joinedAt })
		})

		expect(Utils.stdout).toHaveBeenCalledTimes(0)
		expect(Utils.stdout0).toHaveBeenCalledWith({
			oldValue: null,
			newValue: `joshua`,
		})
		expect(Utils.stdout1).toHaveBeenCalledWith({
			oldValue: null,
			newValue: `lobby`,
		})
		expect(Utils.stdout2).toHaveBeenCalledWith({
			oldValue: null,
			newValue: [`joshua`, { joinedAt }],
		})
		expect(Utils.stdout3).toHaveBeenCalledWith({
			oldValue: null,
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
		const lobbyPlayersState = findRelations(
			roomPlayers,
			`lobby`,
		).playerKeysOfRoom
		const joshuaRoomState = findRelations(roomPlayers, `joshua`).roomKeyOfPlayer
		const lobbyPlayerEntriesState = findRelations(
			roomPlayers,
			`lobby`,
		).playerEntriesOfRoom
		const joshuaRoomEntryState = findRelations(
			roomPlayers,
			`joshua`,
		).roomEntryOfPlayer

		subscribe(lobbyPlayersState, Utils.stdout0)
		subscribe(joshuaRoomState, Utils.stdout1)
		subscribe(lobbyPlayerEntriesState, Utils.stdout2)
		subscribe(joshuaRoomEntryState, Utils.stdout3)

		const joinedAt = Date.now()

		editRelations(roomPlayers, (relations) => {
			relations.set({ player: `joshua`, room: `lobby` }, { joinedAt })
		})

		expect(Utils.stdout0).toHaveBeenCalledWith({
			oldValue: [],
			newValue: [`joshua`],
		})
		expect(Utils.stdout1).toHaveBeenCalledWith({
			oldValue: null,
			newValue: `lobby`,
		})
		expect(Utils.stdout2).toHaveBeenCalledWith({
			oldValue: [],
			newValue: [[`joshua`, { joinedAt }]],
		})
		expect(Utils.stdout3).toHaveBeenCalledWith({
			oldValue: null,
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

		const lobbyPlayersState = findRelations(
			roomPlayers,
			`lobby`,
		).playerKeysOfRoom
		const joshuaRoomsState = findRelations(
			roomPlayers,
			`joshua`,
		).roomKeysOfPlayer
		const lobbyPlayerEntriesState = findRelations(
			roomPlayers,
			`lobby`,
		).playerEntriesOfRoom
		const joshuaRoomsEntriesState = findRelations(
			roomPlayers,
			`joshua`,
		).roomEntriesOfPlayer

		subscribe(lobbyPlayersState, Utils.stdout0)
		subscribe(joshuaRoomsState, Utils.stdout1)
		subscribe(lobbyPlayerEntriesState, Utils.stdout2)
		subscribe(joshuaRoomsEntriesState, Utils.stdout3)

		const joinedAt = Date.now()

		editRelations(roomPlayers, (relations) => {
			relations.set({ player: `joshua`, room: `lobby` }, { joinedAt })
			expect(relations.has(`josh`)).toBe(false)
			expect(relations.has(`josh`, `lobby`)).toBe(false)
			expect(relations.has(`joshua`)).toBe(true)
			expect(relations.has(`joshua`, `lobby`)).toBe(true)
			expect(relations.getContent(`joshua`, `lobby`)).toEqual({
				joinedAt,
			})
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

		editRelations(roomPlayers, (relations) => {
			relations.delete({ player: `joshua`, room: `lobby` })
		})

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
		const lobbyPlayerState = findRelations(roomPlayers, `lobby`).playerKeyOfRoom
		const joshuaRoomState = findRelations(roomPlayers, `joshua`).roomKeyOfPlayer

		const arenaPlayerState = findRelations(roomPlayers, `arena`).playerKeyOfRoom

		subscribe(arenaPlayerState, Utils.stdout)

		subscribe(lobbyPlayerState, Utils.stdout0)
		subscribe(joshuaRoomState, Utils.stdout1)

		editRelations(roomPlayers, (relations) => {
			relations.set({ player: `joshua`, room: `lobby` })
		})
		expect(Utils.stdout).toHaveBeenCalledTimes(0)
		expect(Utils.stdout0).toHaveBeenCalledWith({
			oldValue: null,
			newValue: `joshua`,
		})
		expect(Utils.stdout1).toHaveBeenCalledWith({
			oldValue: null,
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
			key: `I ALWAYS FAIL`,
			do: () => {
				editRelations(cardValues, (relations) => {
					for (let i = 0; i < 100; i++) {
						relations.set({ value: `a`, card: `${i}` })
						if (i === 99) {
							throw new Error(`whoops!`)
						}
					}
				})
			},
		})
		let caught: Error | undefined
		try {
			runTransaction(failingTX)()
		} catch (thrown) {
			if (thrown instanceof Error) caught = thrown
		}
		expect(caught).toBeInstanceOf(Error)
		expect(Internal.IMPLICIT.STORE.valueMap.size).toBe(0)
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
		expect(getState(findRelations(userGroups, `a`).groupKeysOfUser)).toEqual([
			`1`,
		])
		expect(getState(findRelations(userGroups, `b`).groupKeysOfUser)).toEqual([
			`3`,
		])
		expect(getState(findRelations(userGroups, `c`).groupKeysOfUser)).toEqual([
			`2`,
		])
		expect(getState(findRelations(userGroups, `a`).groupKeysOfUser)).toEqual([
			`1`,
		])
		expect(getState(findRelations(userGroups, `b`).groupKeysOfUser)).toEqual([
			`3`,
		])
		expect(getState(findRelations(userGroups, `c`).groupKeysOfUser)).toEqual([
			`2`,
		])
	})

	test(`replacing relations (many to many)`, () => {
		const userGroups = join({
			key: `userGroups`,
			between: [`user`, `group`],
			cardinality: `n:n`,
			relations: [
				[`a`, [`1`]],
				[`b`, [`2`]],
				[`c`, [`3`]],
			],
		})
		editRelations(userGroups, (relations) => {
			relations.replaceRelations(`a`, [`2`, `3`])
		})
		expect(getState(findRelations(userGroups, `a`).groupKeysOfUser)).toEqual([
			`2`,
			`3`,
		])
		expect(getState(findRelations(userGroups, `b`).groupKeysOfUser)).toEqual([
			`2`,
		])
		expect(getState(findRelations(userGroups, `c`).groupKeysOfUser)).toEqual([
			`3`,
		])
		expect(getState(findRelations(userGroups, `1`).groupKeysOfUser)).toEqual([])
		expect(getState(findRelations(userGroups, `2`).userKeysOfGroup)).toEqual([
			`b`,
			`a`,
		])
		expect(getState(findRelations(userGroups, `3`).userKeysOfGroup)).toEqual([
			`c`,
			`a`,
		])
	})
	test(`replacing relations (one to many)`, () => {
		const cardValues = join({
			key: `cardValues`,
			between: [`value`, `card`],
			cardinality: `1:n`,
			relations: [
				[`a`, [`1`]],
				[`b`, [`2`]],
				[`c`, [`3`]],
			],
		})
		editRelations(cardValues, (relations) => {
			relations.replaceRelations(`a`, [`1`, `2`, `3`])
		})
		expect(getState(findRelations(cardValues, `1`).valueKeyOfCard)).toEqual(`a`)
		expect(getState(findRelations(cardValues, `2`).valueKeyOfCard)).toEqual(`a`)
		expect(getState(findRelations(cardValues, `3`).valueKeyOfCard)).toEqual(`a`)
		expect(getState(findRelations(cardValues, `a`).cardKeysOfValue)).toEqual([
			`1`,
			`2`,
			`3`,
		])
		expect(getState(findRelations(cardValues, `b`).cardKeysOfValue)).toEqual([])
		expect(getState(findRelations(cardValues, `c`).cardKeysOfValue)).toEqual([])
	})
	test(`accessing the internal mutable atom family`, () => {
		const membersOfGroups = join({
			key: `membersOfGroups`,
			between: [`group`, `user`],
			cardinality: `1:n`,
		})
		const membersOfGroupsAtoms = getInternalRelations(membersOfGroups)
		expect(membersOfGroupsAtoms.key).toEqual(`membersOfGroups/relatedKeys`)
		expect(membersOfGroupsAtoms.type).toEqual(`mutable_atom_family`)
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
						// cardValues.relations.set({ value: `a`, card: `${i}` })
						editRelations(cardValues, (relations) => {
							relations.set({ value: `a`, card: `${i}` })
						})
					}
				},
			})
		}
		function createLoopingSafeReplacementTX() {
			return transaction<(count: number) => void>({
				key: `loopingSafeReplacement`,
				do: (_, count) => {
					const newRelationsOfA: string[] = []
					for (let i = 0; i < count; i++) {
						newRelationsOfA.push(String(i))
					}
					editRelations(cardValues, (relations) => {
						relations.replaceRelations(`a`, newRelationsOfA)
					})
				},
			})
		}
		function createLoopingUnsafeReplacementTX() {
			return transaction<(count: number) => void>({
				key: `loopingUnsafeReplacement`,
				do: (_, count) => {
					const newRelationsOfA: string[] = []
					for (let i = 0; i < count; i++) {
						newRelationsOfA.push(String(i))
					}
					editRelations(cardValues, (relations) => {
						relations.replaceRelations(`a`, newRelationsOfA, {
							reckless: true,
						})
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
