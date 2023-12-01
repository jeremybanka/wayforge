import { createJoin } from "atom.io/data"
import { vitest } from "vitest"

import { getState, subscribe } from "atom.io"
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
		// expect(true).toBe(true)
		const roomPlayers = createJoin(
			{
				key: `roomPlayers`,
				between: [`room`, `player`],
				cardinality: `1:1`,
			},
			{ joinedAt: NaN },
			Internal.IMPLICIT.STORE,
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
		const roomPlayers = createJoin(
			{
				key: `playersInRooms`,
				between: [`room`, `player`],
				cardinality: `1:n`,
			},
			{ joinedAt: NaN },
			Internal.IMPLICIT.STORE,
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
		const roomPlayers = createJoin(
			{
				key: `playersInRooms`,
				between: [`room`, `player`],
				cardinality: `n:n`,
			},
			{ joinedAt: NaN },
			Internal.IMPLICIT.STORE,
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
