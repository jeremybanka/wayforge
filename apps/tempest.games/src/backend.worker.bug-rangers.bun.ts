#!/usr/bin/env bun

import { type } from "arktype"
import { findState, getInternalRelations, setState, subscribe } from "atom.io"
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
	type TileCoordinatesSerialized,
	turnNumberAtom,
} from "./library/bug-rangers-game-state"

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
	placeTile: type([tileCoordinatesType]),
	placeCube: type([tileCoordinatesType]),
	turnRestart: type([]),
	turnEnd: type([]),
}

const usersInRoomsAtoms = getInternalRelations(usersInRooms)
const ownersOfRoomsAtoms = getInternalRelations(ownersOfRooms)
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
