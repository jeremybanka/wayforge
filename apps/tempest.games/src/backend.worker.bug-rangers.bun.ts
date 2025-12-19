#!/usr/bin/env bun

import { type } from "arktype"
import {
	findRelations,
	findState,
	getInternalRelations,
	getState,
	setState,
	subscribe,
} from "atom.io"
import { IMPLICIT } from "atom.io/internal"
import type { SocketGuard, TypedSocket } from "atom.io/realtime"
import { castSocket, ownersOfRooms, usersInRooms } from "atom.io/realtime"
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

	const coreStack: (() => void)[] = []
	coreStack.push(
		exposeState(myRoomKeyAtom),
		exposeState(turnNumberAtom),
		exposeState(gameStateAtom),
		exposeMutable(playerTurnOrderAtom),
		exposeMutable(gameTilesAtom),
	)

	const roomStack: (() => void)[] = []
	const unsubRoomKey = subscribe(myRoomKeyAtom, ({ newValue: myRoomKey }) => {
		while (roomStack.length) roomStack.pop()?.()
		if (!myRoomKey) return
		const usersHereAtom = findState(usersInRoomsAtoms, myRoomKey)
		roomStack.push(exposeFamily(playerReadyStatusAtoms, usersHereAtom))
	})

	const gameSocket = castSocket<TypedSocket<PlayerActions>>(
		socket,
		bugRangersGuard,
		parent.logger.error,
	)

	// HANDLE ACTIONS
	gameSocket.on(`wantFirst`, () => {
		const gameState = getState(gameStateAtom)
		if (gameState === `setup`) {
			console.log(`setting ready first`, userKey)
			setState(playerReadyStatusAtoms, userKey, `readyWantsFirst`)
		}
	})
	gameSocket.on(`wantNotFirst`, () => {
		const gameState = getState(gameStateAtom)
		if (gameState === `setup`) {
			setState(playerReadyStatusAtoms, userKey, `readyDoesNotWantFirst`)
		}
	})
	gameSocket.on(`startGame`, () => {
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
	})
	gameSocket.on(`placeTile`, (tileCoordinatesSerialized) => {
		setState(gameTilesAtom, (tiles) => {
			tiles.add(tileCoordinatesSerialized)
			return tiles
		})
	})

	return () => {
		for (const unsub of coreStack) unsub()
		for (const unsub of roomStack) unsub()
		unsubRoomKey()
	}
})

parent.logger.info(`🛫 game worker ready`)
