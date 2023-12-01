import { createJoin } from "atom.io/data"
import { vitest } from "vitest"

import { subscribe } from "atom.io"
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
})

describe(`join`, () => {
	test(`supports 1:1 relations`, () => {
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

		subscribe(lobbyPlayerState, Utils.stdout)
		subscribe(joshuaRoomState, Utils.stdout)
		subscribe(arenaPlayerState, Utils.stdout)

		roomPlayers.relations.set(
			{ player: `joshua`, room: `lobby` },
			{ joinedAt: Date.now() },
		)

		expect(Utils.stdout).toHaveBeenCalledTimes(2)
		expect(Utils.stdout).toHaveBeenCalledWith({
			oldValue: undefined,
			newValue: `joshua`,
		})
		expect(Utils.stdout).toHaveBeenCalledWith({
			oldValue: undefined,
			newValue: `lobby`,
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

		subscribe(lobbyPlayersState, Utils.stdout)
		subscribe(joshuaRoomState, Utils.stdout)

		roomPlayers.relations.set(
			{ player: `joshua`, room: `lobby` },
			{ joinedAt: Date.now() },
		)

		expect(Utils.stdout).toHaveBeenCalledWith({
			oldValue: [],
			newValue: [`joshua`],
		})
		expect(Utils.stdout).toHaveBeenCalledWith({
			oldValue: undefined,
			newValue: `lobby`,
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

		subscribe(lobbyPlayersState, Utils.stdout)
		subscribe(joshuaRoomsState, Utils.stdout)

		roomPlayers.relations.set(
			{ player: `joshua`, room: `lobby` },
			{ joinedAt: Date.now() },
		)

		expect(Utils.stdout).toHaveBeenCalledWith({
			oldValue: [],
			newValue: [`joshua`],
		})
		expect(Utils.stdout).toHaveBeenCalledWith({
			oldValue: [],
			newValue: [`lobby`],
		})
	})
})
