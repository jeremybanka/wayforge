import type { Logger } from "atom.io"
import {
	editRelations,
	findRelations,
	getInternalRelations,
	getState,
	join,
	runTransaction,
	subscribe,
	transaction,
} from "atom.io"
import * as Internal from "atom.io/internal"
import { vitest } from "vitest"

import * as Utils from "../__util__"

const LOG_LEVELS = [null, `error`, `warn`, `info`] as const
const CHOOSE = 2

let logger: Logger

beforeEach(() => {
	Internal.clearStore(Internal.IMPLICIT.STORE)
	Internal.IMPLICIT.STORE.loggers[0].logLevel = LOG_LEVELS[CHOOSE]
	logger = Internal.IMPLICIT.STORE.logger = Utils.createNullLogger()
	vitest.spyOn(logger, `error`)
	vitest.spyOn(logger, `warn`)
	vitest.spyOn(logger, `info`)
	vitest.spyOn(Utils, `stdout`)
	vitest.spyOn(Utils, `stdout0`)
	vitest.spyOn(Utils, `stdout1`)
})

describe(`join with content`, () => {
	afterEach(() => {
		expect(logger.warn).not.toHaveBeenCalled()
		expect(logger.error).not.toHaveBeenCalled()
	})
	test(`supports 1:1 relations`, () => {
		const roomPlayers = join({
			key: `roomPlayers`,
			between: [`room`, `player`],
			cardinality: `1:1`,
			isAType: (input): input is `arena` | `lobby` =>
				[`lobby`, `arena`].includes(input),
			isBType: (input): input is `joshua` => input === `joshua`,
		})
		const lobbyPlayerState = findRelations(roomPlayers, `lobby`).playerKeyOfRoom
		const joshuaRoomState = findRelations(roomPlayers, `joshua`).roomKeyOfPlayer

		const arenaPlayerState = findRelations(roomPlayers, `arena`).playerKeyOfRoom

		subscribe(arenaPlayerState, Utils.stdout)

		subscribe(lobbyPlayerState, Utils.stdout0)
		subscribe(joshuaRoomState, Utils.stdout1)

		editRelations(roomPlayers, (relations) => {
			relations.set(`lobby`, `joshua`)
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
	test(`supports 1:n relations`, () => {
		const roomPlayers = join({
			key: `playersInRooms`,
			between: [`room`, `player`],
			cardinality: `1:n`,
			isAType: (input): input is `arena` | `lobby` =>
				[`lobby`, `arena`].includes(input),
			isBType: (input): input is `joshua` => input === `joshua`,
		})
		const lobbyPlayersState = findRelations(
			roomPlayers,
			`lobby`,
		).playerKeysOfRoom
		const joshuaRoomState = findRelations(roomPlayers, `joshua`).roomKeyOfPlayer

		subscribe(lobbyPlayersState, Utils.stdout0)
		subscribe(joshuaRoomState, Utils.stdout1)

		editRelations(roomPlayers, (relations) => {
			relations.set({ player: `joshua`, room: `lobby` })
		})

		expect(Utils.stdout0).toHaveBeenCalledWith({
			oldValue: [],
			newValue: [`joshua`],
		})
		expect(Utils.stdout1).toHaveBeenCalledWith({
			oldValue: null,
			newValue: `lobby`,
		})
	})
	test(`supports n:n relations`, () => {
		const roomPlayers = join({
			key: `playersInRooms`,
			between: [`room`, `player`],
			cardinality: `n:n`,
			isAType: (input): input is `room::arena` | `room::lobby` =>
				[`lobby`, `arena`].includes(input),
			isBType: (input): input is `player::josh` | `player::joshua` =>
				[`josh`, `joshua`].includes(input),
		})

		const lobbyPlayersState = findRelations(
			roomPlayers,
			`room::lobby`,
		).playerKeysOfRoom
		const joshuaRoomsState = findRelations(
			roomPlayers,
			`player::joshua`,
		).roomKeysOfPlayer

		subscribe(lobbyPlayersState, Utils.stdout0)
		subscribe(joshuaRoomsState, Utils.stdout1)

		editRelations(roomPlayers, (relations) => {
			relations.set({ room: `room::lobby`, player: `player::joshua` })
			expect(relations.has(`player::josh`)).toBe(false)
			expect(relations.has(`player::josh`, `room::lobby`)).toBe(false)
			expect(relations.has(`player::joshua`)).toBe(true)
			expect(relations.has(`player::joshua`, `room::lobby`)).toBe(true)
		})

		expect(Utils.stdout0).toHaveBeenCalledWith({
			oldValue: [],
			newValue: [`player::joshua`],
		})
		expect(Utils.stdout1).toHaveBeenCalledWith({
			oldValue: [],
			newValue: [`room::lobby`],
		})

		editRelations(roomPlayers, (relations) => {
			relations.delete(`room::lobby`, `player::joshua`)
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
			isAType: (input): input is `arena` | `lobby` =>
				[`lobby`, `arena`].includes(input),
			isBType: (input): input is `joshua` => input === `joshua`,
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
			isAType: (input): input is string => typeof input === `number`,
			isBType: (input): input is `${number}` =>
				Number(input).toString() === input,
		})
		const failingTX = transaction<() => void>({
			key: `I ALWAYS FAIL`,
			do: ({ relations }) => {
				relations.edit(cardValues, (cvs) => {
					for (let i = 0; i < 100; i++) {
						cvs.set({ value: `a`, card: `${i}` })
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
			isAType: (input): input is `a` | `b` | `c` =>
				[`a`, `b`, `c`].includes(input),
			isBType: (input): input is `1` | `2` | `3` =>
				[`1`, `2`, `3`].includes(input),
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
			isAType: (input): input is `a` | `b` | `c` =>
				[`a`, `b`, `c`].includes(input),
			isBType: (input): input is `1` | `2` | `3` =>
				[`1`, `2`, `3`].includes(input),
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
			isAType: (input): input is string => typeof input === `number`,
			isBType: (input): input is `${number}` =>
				Number(input).toString() === input,
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
			isAType: (input): input is `a` | `b` | `c` =>
				[`a`, `b`, `c`].includes(input),
			isBType: (input): input is `1` | `2` | `3` =>
				[`1`, `2`, `3`].includes(input),
		})
		const [membersOfGroupsAtoms] = getInternalRelations(membersOfGroups, `split`)
		expect(membersOfGroupsAtoms.key).toEqual(`membersOfGroups/relatedKeys`)
		expect(membersOfGroupsAtoms.type).toEqual(`mutable_atom_family`)
	})
})

// describe(`advanced performance tests`, () => {
// 	const ITERATION_COUNTS = [2, 4, 8, 16, 32, 64, 128, 256, 512] as const

// 	function sigFigs(count: number, num: number): number {
// 		if (num === 0) {
// 			return 0
// 		}

// 		const magnitude = Math.floor(Math.log10(Math.abs(num)))
// 		const scale = 10 ** (count - magnitude - 1)

// 		return Math.round(num * scale) / scale
// 	}
// 	test(`setting many relations at once with iteration`, () => {
// 		function createCardValues() {
// 			return join({
// 				key: `cardValues`,
// 				between: [`value`, `card`],
// 				cardinality: `1:n`,
// 				isAType: (_): _ is string => true,
// 				isBType: (input): input is `${number}` =>
// 					Number(input).toString() === input,
// 			})
// 		}
// 		function createBasicTX() {
// 			return transaction<(count: number) => void>({
// 				key: `loopingBasic`,
// 				do: (_, count) => {
// 					for (let i = 0; i < count; i++) {
// 						editRelations(cardValues, (relations) => {
// 							relations.set({ value: `a`, card: `${i}` })
// 						})
// 					}
// 				},
// 			})
// 		}
// 		function createLoopingSafeReplacementTX() {
// 			return transaction<(count: number) => void>({
// 				key: `loopingSafeReplacement`,
// 				do: ({ rel }, count) => {
// 					const newRelationsOfA: `${number}`[] = []
// 					for (let i = 0; i < count; i++) {
// 						newRelationsOfA.push(`${i}`)
// 					}
// 					rel.edit(cardValues, (relations) => {
// 						relations.replaceRelations(`a`, newRelationsOfA)
// 					})
// 				},
// 			})
// 		}
// 		function createLoopingUnsafeReplacementTX() {
// 			return transaction<(count: number) => void>({
// 				key: `loopingUnsafeReplacement`,
// 				do: (_, count) => {
// 					const newRelationsOfA: `${number}`[] = []
// 					for (let i = 0; i < count; i++) {
// 						newRelationsOfA.push(`${i}`)
// 					}
// 					editRelations(cardValues, (relations) => {
// 						relations.replaceRelations(`a`, newRelationsOfA, {
// 							reckless: true,
// 						})
// 					})
// 				},
// 			})
// 		}
// 		let cardValues = createCardValues()
// 		let loopingBasicTX = createBasicTX()
// 		let loopingSafeReplacementTX = createLoopingSafeReplacementTX()
// 		let loopingUnsafeReplacementTX = createLoopingUnsafeReplacementTX()
// 		function reset() {
// 			Internal.clearStore(Internal.IMPLICIT.STORE)
// 			cardValues = createCardValues()
// 			loopingBasicTX = createBasicTX()
// 			loopingSafeReplacementTX = createLoopingSafeReplacementTX()
// 			loopingUnsafeReplacementTX = createLoopingUnsafeReplacementTX()
// 		}
// 		const results = ITERATION_COUNTS.map((count) => {
// 			reset()
// 			let basicTime = Utils.time(`loopingBasic:` + count, () => {
// 				runTransaction(loopingBasicTX)(count)
// 			}).duration
// 			reset()
// 			let safeTime = Utils.time(`loopingBasic:` + count, () => {
// 				runTransaction(loopingSafeReplacementTX)(count)
// 			}).duration
// 			reset()
// 			let unsafeTime = Utils.time(`loopingBasic:` + count, () => {
// 				runTransaction(loopingUnsafeReplacementTX)(count)
// 			}).duration
// 			const minTime = Math.min(basicTime, safeTime, unsafeTime)
// 			const basicRatio = basicTime / minTime
// 			const safeRatio = safeTime / minTime
// 			const unsafeRatio = safeTime / minTime
// 			basicTime -= minTime
// 			safeTime -= minTime
// 			unsafeTime -= minTime
// 			const winner = `✅ (${sigFigs(2, minTime)}ms)`
// 			return {
// 				count,
// 				basic: basicTime === 0 ? winner : `❌ ${sigFigs(1, basicRatio)}`,
// 				safe: safeTime === 0 ? winner : `❌ ${sigFigs(1, safeRatio)}`,
// 				unsafe: unsafeTime === 0 ? winner : `❌ ${sigFigs(1, unsafeRatio)}`,
// 			}
// 		})
// 		console.table(results)
// 	}, 20_000)
// })
