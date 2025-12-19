#!/usr/bin/env bun

import { type } from "arktype"
import { getInternalRelations, setState, subscribe } from "atom.io"
import { IMPLICIT } from "atom.io/internal"
import type { SocketGuard, TypedSocket } from "atom.io/realtime"
import { castSocket, usersInRooms } from "atom.io/realtime"
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
	gameTilesAtom,
	type PlayerActions,
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
pullAtom(IMPLICIT.STORE, parentSocket, myRoomKeyAtom)
let unsubPullUsers: (() => void) | undefined
subscribe(myRoomKeyAtom, ({ newValue: myRoomKey }) => {
	unsubPullUsers?.()
	if (!myRoomKey) return
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

	const unsubFunctions: (() => void)[] = []
	unsubFunctions.push(
		exposeState(turnNumberAtom),
		exposeMutable(playerTurnOrderAtom),
		exposeMutable(gameTilesAtom),
	)

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
		unsubFunctions.forEach((unsub) => {
			unsub()
		})
	}
})

parent.logger.info(`🛫 game worker ready`)
