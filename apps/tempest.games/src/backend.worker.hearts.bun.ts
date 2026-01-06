#!/usr/bin/env bun

import { type } from "arktype"
import {
	AtomIOLogger,
	findRelations,
	findState,
	getInternalRelations,
	getState,
	resetState,
	setState,
} from "atom.io"
import { IMPLICIT } from "atom.io/internal"
import type { RoomKey, SocketGuard } from "atom.io/realtime"
import {
	employSocket,
	guardSocket,
	ownersOfRooms,
	usersInRooms,
} from "atom.io/realtime"
import { pullMutableAtomFamilyMember } from "atom.io/realtime-client"
import {
	ParentSocket,
	realtimeAtomFamilyProvider,
	realtimeMutableProvider,
	realtimeStateProvider,
} from "atom.io/realtime-server"
import { Socket } from "socket.io-client"

import { parentSocket } from "./backend/logger"
import type { PlayerColor } from "./library/bug-rangers-game-state"
import {
	gameStateAtom,
	gameTilesAtom,
	gameTilesStackHeightAtoms,
	PLAYER_COLORS,
	playerColorAtoms,
	playerReadyStatusAtoms,
	playerRemainingCubesAtoms,
	playerRemainingTilesAtoms,
	playerTurnOrderAtom,
	setupGroupsSelector,
	tileCubeCountAtoms,
	tileOwnerAtoms,
	turnInProgressAtom,
	turnNumberAtom,
} from "./library/bug-rangers-game-state"
import { env } from "./library/env"
import { pureShuffle } from "./library/shuffle"
import type { HeartsActions } from "./library/topdeck/actions"

const parent: ParentSocket<any, any, any> = ((process as any).parentSocket ??=
	new ParentSocket(process))
Object.assign(console, parent.logger, { log: parent.logger.info })

parent.on(`timeToStop`, function gracefulExit() {
	parent.logger.info(`🛬 game worker exiting`)
	process.exit(0)
})

IMPLICIT.STORE.loggers[0] = new AtomIOLogger(
	`info`,
	(...params) => {
		if (![`⭕`, `🔴`, `🟢`, `🚫`, `❌`, `👀`, `🙈`].includes(params[0])) {
			return false
		}
		let idx = 0
		for (const param of params) {
			if (param instanceof Socket) {
				params[idx] = `Socket:${param.id}`
			}
			idx++
		}
		return params
	},
	parent.logger,
)

const heartsGuard: SocketGuard<HeartsActions> = {
	// SETUP PHASE
	wantFirst: type([]),
	wantNotFirst: type([]),
	startGame: type([]),
}

const ROOM_KEY = process.env[`REALTIME_ROOM_KEY`] as RoomKey
const usersInRoomsAtoms = getInternalRelations(usersInRooms)
const ownersOfRoomsAtoms = getInternalRelations(ownersOfRooms)
;(function globalSetup() {
	if ((process as any).globalSetupDone) return
	;(process as any).globalSetupDone = true
	pullMutableAtomFamilyMember(
		IMPLICIT.STORE,
		parentSocket,
		usersInRoomsAtoms,
		ROOM_KEY,
	)
	pullMutableAtomFamilyMember(
		IMPLICIT.STORE,
		parentSocket,
		ownersOfRoomsAtoms,
		ROOM_KEY,
	)
})()

parent.receiveRelay((socket, userKey) => {
	const config = { socket, consumer: userKey }
	const exposeState = realtimeStateProvider(config)
	const exposeMutable = realtimeMutableProvider(config)
	const exposeFamily = realtimeAtomFamilyProvider(config)

	const gameSocket = guardSocket<HeartsActions>(
		socket,
		heartsGuard,
		parent.logger.error,
	)
	const usersHereAtom = findState(usersInRoomsAtoms, ROOM_KEY)

	const coreStack: (() => void)[] = []
	coreStack.push(
		exposeState(turnNumberAtom),
		exposeState(gameStateAtom),
		exposeMutable(playerTurnOrderAtom),
		exposeFamily(playerReadyStatusAtoms, usersHereAtom),
		exposeFamily(playerColorAtoms, usersHereAtom),
		exposeFamily(tileCubeCountAtoms, gameTilesAtom),
		exposeFamily(gameTilesStackHeightAtoms, gameTilesAtom),
		employSocket(gameSocket, `wantFirst`, () => {
			const gameState = getState(gameStateAtom)
			if (gameState === `setup`) {
				setState(playerReadyStatusAtoms, userKey, `readyWantsFirst`)
			}
		}),
		employSocket(gameSocket, `wantNotFirst`, () => {
			const gameState = getState(gameStateAtom)
			if (gameState === `setup`) {
				setState(playerReadyStatusAtoms, userKey, `readyDoesNotWantFirst`)
			}
		}),
		employSocket(gameSocket, `startGame`, async () => {
			const ownerOfRoomSelector = findRelations(
				ownersOfRooms,
				ROOM_KEY,
			).userKeyOfRoom
			const ownerOfRoom = getState(ownerOfRoomSelector)
			const gameState = getState(gameStateAtom)
			if (ownerOfRoom !== userKey) return
			if (gameState !== `setup`) return
			const setupGroups = getState(setupGroupsSelector)
			setState(gameStateAtom, `playing`)
			const firstPlayersShuffled = pureShuffle(setupGroups.readyWantsFirst)
			const nextPlayersShuffled = pureShuffle(setupGroups.readyDoesNotWantFirst)
			await new Promise((resolve) => setTimeout(resolve, 600))
			for (const k of firstPlayersShuffled) {
				setState(playerTurnOrderAtom, (permanent) => {
					permanent.push(k)
					return permanent
				})
				await new Promise((resolve) => setTimeout(resolve, 300))
			}
			for (const k of nextPlayersShuffled) {
				setState(playerTurnOrderAtom, (permanent) => {
					permanent.push(k)
					return permanent
				})
				await new Promise((resolve) => setTimeout(resolve, 300))
			}
		}),
	)

	if (env.RUN_WORKERS_FROM_SOURCE === true) {
		coreStack.push(
			employSocket(socket, `RESET_GAME`, () => {
				setState(gameStateAtom, `setup`)
				setState(
					playerTurnOrderAtom,
					(permanent) => ((permanent.length = 0), permanent),
				)
				const usersHere = getState(
					findRelations(usersInRooms, ROOM_KEY).userKeysOfRoom,
				)
				for (const u of usersHere) {
					setState(playerReadyStatusAtoms, u, `notReady`)
					setState(playerColorAtoms, u, null)
					setState(playerRemainingCubesAtoms, u, 20)
					setState(playerRemainingTilesAtoms, u, 12)
				}
				resetState(turnNumberAtom)
				resetState(turnInProgressAtom)
				resetState(playerTurnOrderAtom)
				for (const tile of getState(gameTilesAtom)) {
					resetState(tileCubeCountAtoms, tile)
					resetState(tileOwnerAtoms, tile)
					resetState(gameTilesStackHeightAtoms, tile)
				}
				setState(gameTilesAtom, (permanent) => (permanent.clear(), permanent))
			}),
		)
	}

	return () => {
		for (const unsub of coreStack) unsub()
	}
})

parent.logger.info(`🛫 game worker ready`)
