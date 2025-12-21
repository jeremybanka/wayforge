#!/usr/bin/env bun

import { type } from "arktype"
import {
	AtomIOLogger,
	findRelations,
	findState,
	getInternalRelations,
	getState,
	setState,
	subscribe,
} from "atom.io"
import { IMPLICIT } from "atom.io/internal"
import type { SocketGuard, TypedSocket } from "atom.io/realtime"
import {
	castSocket,
	employSocket,
	ownersOfRooms,
	usersInRooms,
} from "atom.io/realtime"
import {
	myRoomKeyAtom,
	pullAtom,
	pullMutableAtomFamilyMember,
} from "atom.io/realtime-client"
import {
	ParentSocket,
	realtimeAtomFamilyProvider,
	realtimeMutableProvider,
	realtimeStateProvider,
} from "atom.io/realtime-server"
import { Socket } from "socket.io-client"

import { parentSocket } from "./backend/logger"
import {
	gameStateAtom,
	gameTilesAtom,
	type PlayerActions,
	playerReadyStatusAtoms,
	playerTurnOrderAtom,
	setupGroupsSelector,
	type TileCoordinatesSerialized,
	turnNumberAtom,
} from "./library/bug-rangers-game-state"
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

const bugRangersGuard: SocketGuard<PlayerActions> = {
	// DEBUG
	startOver: type([]),
	// SETUP PHASE
	wantFirst: type([]),
	wantNotFirst: type([]),
	startGame: type([]),
	// PLAYERS
	placeTile: type([tileCoordinatesType]),
	placeCube: type([tileCoordinatesType]),
	turnRestart: type([]),
	turnEnd: type([]),
}

const usersInRoomsAtoms = getInternalRelations(usersInRooms)
const ownersOfRoomsAtoms = getInternalRelations(ownersOfRooms)
;(function globalSetup() {
	if ((process as any).globalSetupDone) return
	;(process as any).globalSetupDone = true
	pullAtom(IMPLICIT.STORE, parentSocket, myRoomKeyAtom)
	let unsubPullOwner: (() => void) | undefined
	let unsubPullUsers: (() => void) | undefined
	subscribe(myRoomKeyAtom, ({ newValue: myRoomKey }) => {
		unsubPullOwner?.()
		unsubPullUsers?.()
		if (!myRoomKey) return
		unsubPullOwner = pullMutableAtomFamilyMember(
			IMPLICIT.STORE,
			parentSocket,
			ownersOfRoomsAtoms,
			myRoomKey,
		)
		unsubPullUsers = pullMutableAtomFamilyMember(
			IMPLICIT.STORE,
			parentSocket,
			usersInRoomsAtoms,
			myRoomKey,
		)
	})
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

	const coreStack: (() => void)[] = []
	coreStack.push(
		exposeState(myRoomKeyAtom),
		exposeState(turnNumberAtom),
		exposeState(gameStateAtom),
		exposeMutable(playerTurnOrderAtom),
		exposeMutable(gameTilesAtom),
		employSocket(gameSocket, `wantFirst`, () => {
			const gameState = getState(gameStateAtom)
			if (gameState === `setup`) {
				console.log(`setting ready first`, userKey)
				setState(playerReadyStatusAtoms, userKey, `readyWantsFirst`)
			}
		}),
		employSocket(gameSocket, `wantNotFirst`, () => {
			const gameState = getState(gameStateAtom)
			if (gameState === `setup`) {
				setState(playerReadyStatusAtoms, userKey, `readyDoesNotWantFirst`)
			}
		}),
		employSocket(gameSocket, `startGame`, () => {
			const myRoomKey = getState(myRoomKeyAtom)
			if (!myRoomKey) return
			const ownerOfRoomSelector = findRelations(
				ownersOfRooms,
				myRoomKey,
			).userKeyOfRoom
			const ownerOfRoom = getState(ownerOfRoomSelector)
			if (ownerOfRoom !== userKey) return
			const gameState = getState(gameStateAtom)
			if (gameState !== `setup`) return
			setState(gameStateAtom, `playing`)
			const setupGroups = getState(setupGroupsSelector)
			const firstPlayersShuffled = pureShuffle(setupGroups.notReady)
			const nextPlayersShuffled = pureShuffle(setupGroups.readyDoesNotWantFirst)
			setState(playerTurnOrderAtom, (permanent) => {
				for (const k of firstPlayersShuffled) {
					permanent.push(k)
				}
				for (const k of nextPlayersShuffled) {
					permanent.push(k)
				}
				return permanent
			})
		}),
		employSocket(gameSocket, `placeTile`, (tileCoordinatesSerialized) => {
			setState(gameTilesAtom, (tiles) => {
				tiles.add(tileCoordinatesSerialized)
				return tiles
			})
		}),
	)

	const roomStack: (() => void)[] = []
	const unsubRoomKey = subscribe(myRoomKeyAtom, ({ newValue: myRoomKey }) => {
		while (roomStack.length) roomStack.pop()?.()
		if (!myRoomKey) return
		const usersHereAtom = findState(usersInRoomsAtoms, myRoomKey)
		roomStack.push(exposeFamily(playerReadyStatusAtoms, usersHereAtom))
	})

	console.log(
		`✨✨✨`,
		IMPLICIT.STORE.atoms.get(`*gameTiles`)?.subject.subscribers,
	)

	return () => {
		console.log(`👺👺👺👺👺👺👺 CLOSING RELAY`)
		for (const unsub of coreStack) unsub()
		for (const unsub of roomStack) unsub()
		unsubRoomKey()
	}
})

parent.logger.info(`🛫 game worker ready`)
