#!/usr/bin/env bun

import { type } from "arktype"
import {
	AtomIOLogger,
	findState,
	getInternalRelations,
	getState,
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
import {
	pullMutableAtomFamilyMember,
	roomOwnerSelector,
} from "atom.io/realtime-client"
import {
	ParentSocket,
	realtimeAtomFamilyProvider,
	realtimeMutableProvider,
	realtimeStateProvider,
} from "atom.io/realtime-server"
import { Socket } from "socket.io-client"

import { parentSocket } from "./backend/logger"
import { playerColorAtoms } from "./library/game-systems/bug-rangers-game-state"
import {
	gameStateAtom,
	playerReadyStatusAtoms,
	playerTurnOrderAtom,
	setupGroupsSelector,
	type TurnBasedGameActions,
	turnNumberAtom,
} from "./library/game-systems/game-setup-turn-order-and-spectators"
import { pureShuffle } from "./library/shuffle"

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

const heartsGuard: SocketGuard<TurnBasedGameActions> = {
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

	const gameSocket = guardSocket<TurnBasedGameActions>(
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
		employSocket(gameSocket, `wantFirst`, () => {
			const gameState = getState(gameStateAtom)
			if (gameState !== `setup`) return
			setState(playerReadyStatusAtoms, userKey, `readyWantsFirst`)
		}),
		employSocket(gameSocket, `wantNotFirst`, () => {
			const gameState = getState(gameStateAtom)
			if (gameState !== `setup`) return
			setState(playerReadyStatusAtoms, userKey, `readyDoesNotWantFirst`)
		}),
		employSocket(gameSocket, `startGame`, async () => {
			const gameState = getState(gameStateAtom)
			if (gameState !== `setup`) return
			const ownerOfRoom = getState(roomOwnerSelector)
			if (ownerOfRoom !== userKey) return
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

	return () => {
		for (const unsub of coreStack) unsub()
	}
})

parent.logger.info(`🛫 game worker ready`)
