#!/usr/bin/env bun

import { type } from "arktype"
import { setState } from "atom.io"
import type { SocketGuard, TypedSocket } from "atom.io/realtime"
import { castSocket } from "atom.io/realtime"
import {
	ParentSocket,
	realtimeAtomFamilyProvider,
	realtimeMutableProvider,
	realtimeStateProvider,
} from "atom.io/realtime-server"

import {
	gameTilesAtom,
	type PlayerActions,
	type TileCoordinatesSerialized,
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

parent.receiveRelay((socket, userKey) => {
	const exposeState = realtimeStateProvider({ socket, userKey })
	const exposeMutable = realtimeMutableProvider({ socket, userKey })
	const exposeFamily = realtimeAtomFamilyProvider({ socket, userKey })

	const unsubFunctions: (() => void)[] = []

	unsubFunctions.push(exposeMutable(gameTilesAtom))

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
