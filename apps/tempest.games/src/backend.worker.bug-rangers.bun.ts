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
	TileCubeCount,
	TileStackHeight,
} from "./library/bug-rangers-game-state"
import {
	gameStateAtom,
	gameTilesAtom,
	gameTilesStackHeightAtoms,
	maximumStackHeightSelectors,
	playableZonesAtom,
	PLAYER_COLORS,
	playerColorAtoms,
	playerReadyStatusAtoms,
	playerRemainingCubesAtoms,
	playerRemainingTilesAtoms,
	playerTurnOrderAtom,
	playerTurnSelector,
	setupGroupsSelector,
	setWarTarget,
	tileCubeCountAtoms,
	tileOwnerAtoms,
	turnCanBeEndedSelector,
	turnInProgressAtom,
	turnNumberAtom,
} from "./library/bug-rangers-game-state"
import { env } from "./library/env"
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
	chooseAttacker: type([tileCoordinatesType]),
	chooseTarget: type([tileCoordinatesType]),
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
		exposeState(turnInProgressAtom),
		exposeMutable(playerTurnOrderAtom),
		exposeMutable(gameTilesAtom),
		exposeFamily(playerReadyStatusAtoms, usersHereAtom),
		exposeFamily(playerColorAtoms, usersHereAtom),
		exposeFamily(playerRemainingCubesAtoms, usersHereAtom),
		exposeFamily(playerRemainingTilesAtoms, usersHereAtom),
		exposeFamily(tileOwnerAtoms, gameTilesAtom),
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
		employSocket(gameSocket, `chooseColor`, (color) => {
			const playerWhoseTurnItIs = getState(playerTurnSelector)
			if (playerWhoseTurnItIs !== userKey) return
			setState(playerColorAtoms, userKey, color)
		}),
		employSocket(gameSocket, `placeTile`, (tileCoordinatesSerialized) => {
			const playerWhoseTurnItIs = getState(playerTurnSelector)
			if (playerWhoseTurnItIs !== userKey) return

			const remainingTiles = getState(playerRemainingTilesAtoms, userKey)
			if (remainingTiles <= 0) return

			const turnInProgress = getState(turnInProgressAtom)
			switch (turnInProgress?.type) {
				case `arm`:
				case `war`:
					break
				case null:
				case undefined:
					{
						const playableZones = getState(playableZonesAtom)
						if (!playableZones.includes(tileCoordinatesSerialized)) return
						setState(gameTilesAtom, (tiles) => {
							tiles.add(tileCoordinatesSerialized)
							return tiles
						})
						setState(playerRemainingTilesAtoms, userKey, (n) => n - 1)
						setState(turnInProgressAtom, {
							type: `build`,
							target: tileCoordinatesSerialized,
							count: 1,
						})
					}
					break
				case `build`:
					{
						const maximumStackHeight = getState(maximumStackHeightSelectors, [
							turnInProgress.target,
							userKey,
						])
						if (maximumStackHeight === 0) return
						const stackHeight = getState(
							gameTilesStackHeightAtoms,
							turnInProgress.target,
						)
						if (stackHeight >= maximumStackHeight) return
						setState(playerRemainingTilesAtoms, userKey, (n) => n + 1)
						setState(
							gameTilesStackHeightAtoms,
							turnInProgress.target,
							(stackHeight + 1) as TileStackHeight,
						)
						socket.emit(`placeTile`, turnInProgress.target)
					}
					break
			}
		}),
		employSocket(gameSocket, `placeCube`, (tileCoordinatesSerialized) => {
			const playerWhoseTurnItIs = getState(playerTurnSelector)
			if (playerWhoseTurnItIs !== userKey) return

			const remainingCubes = getState(playerRemainingCubesAtoms, userKey)
			if (remainingCubes <= 0) return

			const turnInProgress = getState(turnInProgressAtom)
			switch (turnInProgress?.type) {
				case `war`:
					break
				case null:
				case undefined:
					{
						setState(turnInProgressAtom, {
							type: `arm`,
							targets: [tileCoordinatesSerialized],
						})
						setState(playerRemainingCubesAtoms, userKey, (n) => n - 1)
						setState(
							tileCubeCountAtoms,
							tileCoordinatesSerialized,
							(current) => (current + 1) as TileCubeCount,
						)
					}
					break
				case `arm`:
					{
						if (turnInProgress.targets.length >= 2) return
						setState(
							tileCubeCountAtoms,
							tileCoordinatesSerialized,
							(current) => (current + 1) as TileCubeCount,
						)
						setState(playerRemainingCubesAtoms, userKey, (n) => n - 1)
						setState(turnInProgressAtom, {
							type: `arm`,
							targets: [turnInProgress.targets[0]!, tileCoordinatesSerialized],
						})
					}
					break
				case `build`:
					setState(
						tileCubeCountAtoms,
						turnInProgress.target,
						(current) => (current + 1) as TileCubeCount,
					)
					setState(tileOwnerAtoms, turnInProgress.target, userKey)
					setState(turnInProgressAtom, null)
					setState(turnNumberAtom, (current) => current + 1)
					break
			}
		}),
		employSocket(gameSocket, `chooseAttacker`, (tileCoordinatesSerialized) => {
			const playerWhoseTurnItIs = getState(playerTurnSelector)
			if (playerWhoseTurnItIs !== userKey) return
			const turnInProgress = getState(turnInProgressAtom)
			if (turnInProgress === null) {
				setState(turnInProgressAtom, {
					type: `war`,
					attacker: tileCoordinatesSerialized,
					targets: [],
					originalOwners: {},
				})
			}
		}),
		employSocket(gameSocket, `chooseTarget`, (tileCoordinatesSerialized) => {
			const playerWhoseTurnItIs = getState(playerTurnSelector)
			if (playerWhoseTurnItIs !== userKey) return
			const turnInProgress = getState(turnInProgressAtom)
			if (turnInProgress === null) return
			switch (turnInProgress.type) {
				case `arm`:
				case `build`:
					break
				case `war`:
					{
						const tileOwner = getState(tileOwnerAtoms, tileCoordinatesSerialized)
						const stackHeight = getState(
							gameTilesStackHeightAtoms,
							tileCoordinatesSerialized,
						)
						setWarTarget(
							playerWhoseTurnItIs,
							tileOwner,
							stackHeight,
							turnInProgress,
							tileCoordinatesSerialized,
						)
					}
					break
			}
		}),
		employSocket(gameSocket, `turnRestart`, () => {
			const playerWhoseTurnItIs = getState(playerTurnSelector)
			if (playerWhoseTurnItIs !== userKey) return
			const turnInProgress = getState(turnInProgressAtom)
			if (turnInProgress === null) return
			switch (turnInProgress.type) {
				case `arm`:
					{
						const { targets } = turnInProgress
						for (const target of targets) {
							setState(
								tileCubeCountAtoms,
								target,
								(n) => (n - 1) as TileCubeCount,
							)
						}
						setState(
							playerRemainingCubesAtoms,
							userKey,
							(n) => n + targets.length,
						)
					}
					break
				case `build`:
					{
						const { target, count } = turnInProgress
						setState(gameTilesStackHeightAtoms, target, 0 as TileStackHeight)
						setState(tileCubeCountAtoms, target, 0 as TileCubeCount)
						setState(tileOwnerAtoms, target, null)
						setState(playerRemainingTilesAtoms, userKey, (n) => n + count)
						setState(gameTilesAtom, (permanent) => {
							permanent.delete(target)
							return permanent
						})
					}
					break
				case `war`: {
					const { attacker, targets, originalOwners } = turnInProgress
					if (attacker === null) return
					if (targets.length === 0) {
						setState(turnInProgressAtom, null)
						return
					}
					const enemiesVisited = new Set<TileCoordinatesSerialized>()
					for (const target of targets) {
						if (getState(tileCubeCountAtoms, target) === 0) {
							setState(tileOwnerAtoms, target, originalOwners[target])
						}
						const ownerOfTarget = getState(tileOwnerAtoms, target)
						if (ownerOfTarget === userKey) {
							// FRIENDLY
							setState(
								tileCubeCountAtoms,
								target,
								(current) => (current - 1) as TileCubeCount,
							)
							setState(
								tileCubeCountAtoms,
								attacker,
								(current) => (current + 1) as TileCubeCount,
							)
							// FRIENDLY
						} else {
							// ENEMY
							setState(
								tileCubeCountAtoms,
								target,
								(n) => (n + 1) as TileCubeCount,
							)
							if (enemiesVisited.has(target)) {
								setState(
									tileCubeCountAtoms,
									attacker,
									(current) => (current + 1) as TileCubeCount,
								)
							} else {
								const targetHeight = getState(gameTilesStackHeightAtoms, target)
								const attackerHeight = getState(
									gameTilesStackHeightAtoms,
									attacker,
								)
								if (targetHeight > attackerHeight) {
									const heightDiff = targetHeight - attackerHeight
									setState(
										tileCubeCountAtoms,
										attacker,
										(n) => (n + heightDiff + 1) as TileCubeCount,
									)
								} else {
									setState(
										tileCubeCountAtoms,
										attacker,
										(n) => (n + 1) as TileCubeCount,
									)
								}
							}

							enemiesVisited.add(target)
							// ENEMY
						}
					}
				}
			}
			setState(turnInProgressAtom, null)
		}),
		employSocket(gameSocket, `turnEnd`, () => {
			const playerWhoseTurnItIs = getState(playerTurnSelector)
			if (playerWhoseTurnItIs !== userKey) return
			const turnCanBeEnded = getState(turnCanBeEndedSelector)
			if (!turnCanBeEnded) return
			setState(turnInProgressAtom, null)
			setState(turnNumberAtom, (current) => current + 1)
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
