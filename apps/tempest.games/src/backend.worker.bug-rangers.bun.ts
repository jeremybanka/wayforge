#!/usr/bin/env bun

import { ArkErrors, type } from "arktype"
import {
	AtomIOLogger,
	findRelations,
	findState,
	getInternalRelations,
	getState,
	setState,
} from "atom.io"
import { IMPLICIT } from "atom.io/internal"
import type { RoomKey, SocketGuard, TypedSocket } from "atom.io/realtime"
import {
	castSocket,
	employSocket,
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
import type {
	PlayerActions,
	PlayerColor,
	TileCoordinatesSerialized,
} from "./library/bug-rangers-game-state"
import {
	gameStateAtom,
	gameTilesAtom,
	PLAYER_COLORS,
	playerColorAtoms,
	playerReadyStatusAtoms,
	playerTurnOrderAtom,
	setupGroupsSelector,
	turnNumberAtom,
} from "./library/bug-rangers-game-state"
import { env } from "./library/env"
import { pureShuffle } from "./shuffle"

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

const tileCoordinatesType =
	type(/^-?\d+_-?\d+_-?\d+$/).as<TileCoordinatesSerialized>()

const playerColorType = type(/^#([0-9a-f]{3})$/).pipe((maybeColor) => {
	if (PLAYER_COLORS.includes(maybeColor as PlayerColor)) {
		return maybeColor as PlayerColor
	}
	throw new Error(`invalid color: ${maybeColor}`)
})

const bugRangersGuard: SocketGuard<PlayerActions> = {
	// DEBUG
	startOver: type([]),
	// SETUP PHASE
	wantFirst: type([]),
	wantNotFirst: type([]),
	startGame: type([]),
	// FIRST TURN
	chooseColor: type([playerColorType]),
	// PLAYERS
	placeTile: type([tileCoordinatesType]),
	placeCube: type([tileCoordinatesType]),
	turnRestart: type([]),
	turnEnd: type([]),
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

	const gameSocket = castSocket<TypedSocket<PlayerActions>>(
		socket,
		bugRangersGuard,
		parent.logger.error,
	)
	const usersHereAtom = findState(usersInRoomsAtoms, ROOM_KEY)

	const coreStack: (() => void)[] = []
	coreStack.push(
		exposeState(turnNumberAtom),
		exposeState(gameStateAtom),
		exposeMutable(playerTurnOrderAtom),
		exposeMutable(gameTilesAtom),
		exposeFamily(playerReadyStatusAtoms, usersHereAtom),
		exposeFamily(playerColorAtoms, usersHereAtom),
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
			await new Promise((resolve) => setTimeout(resolve, 300))
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
			// setState(playerTurnOrderAtom, (permanent) => {
			// 	for (const k of firstPlayersShuffled) {
			// 		permanent.push(k)
			// 	}
			// 	for (const k of nextPlayersShuffled) {
			// 		permanent.push(k)
			// 	}
			// 	return permanent
			// })
		}),
		employSocket(gameSocket, `chooseColor`, (color) => {
			setState(playerColorAtoms, userKey, color)
		}),
		employSocket(gameSocket, `placeTile`, (tileCoordinatesSerialized) => {
			setState(gameTilesAtom, (tiles) => {
				tiles.add(tileCoordinatesSerialized)
				return tiles
			})
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
				for (const k of usersHere) {
					setState(playerReadyStatusAtoms, k, `notReady`)
				}
			}),
		)
	}

	return () => {
		for (const unsub of coreStack) unsub()
	}
})

parent.logger.info(`🛫 game worker ready`)
