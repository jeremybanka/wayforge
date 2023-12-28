import * as AtomIO from "atom.io"
import { getUpdateToken } from "atom.io/internal"
import * as RTS from "atom.io/realtime-server"
import dotenv from "dotenv"
import { pipe } from "fp-ts/function"
import { Server as WebSocketServer } from "socket.io"

import type { Json } from "~/packages/anvl/src/json"

import type {
	SetRTX,
	SetRTXJson,
} from "~/packages/atom.io/transceivers/set-rtx/src"
import { logger } from "./logger"
import {
	addCardValueTX,
	addHandTx,
	cardCycleGroupsAndZones,
	cardGroupIndex,
	cardIndex,
	cardValuesIndex,
	dealCardsTX,
	findCardGroupState,
	findCardState,
	findCardValueState,
	groupsOfCards,
	ownersOfGroups,
	shuffleDeckTX,
	spawnCardTX,
	spawnClassicDeckTX,
	valuesOfCards,
} from "./store/game"
import type { JoinRoomIO } from "./store/rooms"
import {
	createRoomTX,
	joinRoomTX,
	leaveRoomTX,
	playersInRooms,
	playersIndex,
	roomsIndex,
} from "./store/rooms"
import { welcome } from "./welcome"

welcome(logger)

const TIMESTAMP = Date.now()

dotenv.config()
pipe(
	new WebSocketServer(3333, {
		cors: {
			origin: `http://localhost:5400`,
			methods: [`GET`, `POST`],
		},
	}),
	(io) => {
		io.on(`connection`, (socket) => {
			// WELCOME
			logger.info(socket.id, `connected`)
			io.emit(`connection`, TIMESTAMP)
			AtomIO.setState(playersIndex, (playersIndex) =>
				playersIndex.add(socket.id),
			)
			socket.on(`disconnect`, () => {
				AtomIO.setState(playersIndex, (playersIndex) => {
					playersIndex.delete(socket.id)
					return playersIndex
				})
				playersInRooms.relations.delete({ player: socket.id })
			})

			// LOGGING
			socket.onAny((event, ...args) => {
				logger.info(`${socket.id}`, event, ...args)
			})
			socket.onAnyOutgoing((event, ...args) => {
				if (JSON.stringify(args).length > 1000) {
					const summary = {
						string: `${JSON.stringify(args).slice(0, 10)}...`,
					}[typeof args[0]]
					logger.info(`${socket.id} <<`, event, summary, `...`)
					return
				}
				logger.info(`${socket.id} <<`, event, ...args)
			})

			// COMPOSE REALTIME SERVICE HOOKS
			const exposeSingle = RTS.useExposeSingle({ socket })
			const exposeMutable = RTS.useExposeMutable({ socket })
			const exposeFamily = RTS.useExposeFamily({ socket })
			const exposeMutableFamily = RTS.useExposeMutableFamily({ socket })
			const receiveTransaction = RTS.useReceiveTransaction({ socket })

			// ROOM SERVICES
			exposeMutable(roomsIndex)
			exposeMutableFamily(playersInRooms.core.findRelatedKeysState, roomsIndex)
			socket.on(
				`tx:createRoom`,
				(update: AtomIO.TransactionUpdate<() => string>) => {
					AtomIO.runTransaction(createRoomTX)(update.output)
				},
			)
			socket.on(
				`tx:joinRoom`,
				(update: AtomIO.TransactionUpdate<JoinRoomIO>) => {
					const { roomId, playerId } = update.params[0]
					if (playerId !== socket.id) {
						logger.error(socket.id, `tried to join:room as`, playerId)
						socket.disconnect()
					}
					AtomIO.runTransaction(joinRoomTX)(...update.params)
					socket.join(roomId)
					const playersInRoomState =
						playersInRooms.core.findRelatedKeysState(roomId)
					const playersInRoomTrackerToken = getUpdateToken(playersInRoomState)
					const unsubscribeFromPlayersInRoomTracker = AtomIO.subscribe(
						playersInRoomTrackerToken,
						({ newValue }) => {
							socket.emit(
								`next:${playersInRoomTrackerToken.key}:${roomId}`,
								newValue,
							)
						},
					)
					socket.on(`tx:leaveRoom`, () => {
						AtomIO.runTransaction(leaveRoomTX)({ roomId, playerId: socket.id })
						socket.leave(roomId)
						unsubscribeFromPlayersInRoomTracker()
					})
					// const unsubscribeFromPlayersInRoom = AtomIO.subscribe(
					// 	playersInRooms.findRelationTrackerState__INTERNAL(roomId),
					// 	({ newValue }) => {
					// 		socket.emit(`next:playersInRoom::mutable:tracker:${roomId}`, [...newValue])
					// 	},
					// )
					// socket.on(`tx:leaveRoom`, () => {
					// 	AtomIO.runTransaction(leaveRoomTX)({ roomId, playerId: socket.id })
					// 	socket.leave(roomId)
					// 	unsubscribeFromPlayersInRoom()
					// })
				},
			)

			// GAME SERVICES

			const gameIndices: AtomIO.MutableAtomToken<
				SetRTX<string>,
				SetRTXJson<string>
			>[] = [cardIndex, cardGroupIndex, cardValuesIndex]
			// biome-ignore lint/complexity/noForEach: for readability
			gameIndices.forEach(exposeMutable)

			exposeMutableFamily(
				groupsOfCards.core.findRelatedKeysState,
				cardGroupIndex,
			)
			exposeMutableFamily(groupsOfCards.core.findRelatedKeysState, cardIndex)
			exposeMutableFamily(ownersOfGroups.core.findRelatedKeysState, playersIndex)
			exposeMutableFamily(
				ownersOfGroups.core.findRelatedKeysState,
				cardGroupIndex,
			)
			exposeMutableFamily(valuesOfCards.core.findRelatedKeysState, cardIndex)
			exposeMutableFamily(
				valuesOfCards.core.findRelatedKeysState,
				cardValuesIndex,
			)
			exposeMutableFamily(
				cardCycleGroupsAndZones.core.findRelatedKeysState,
				cardGroupIndex,
			)
			exposeMutableFamily(
				cardCycleGroupsAndZones.core.findRelatedKeysState,
				cardIndex,
			)

			const gameStateFamilies: [
				AtomIO.AtomFamily<Json.Object>,
				AtomIO.StateToken<Set<string>>,
			][] = [
				[findCardState, cardIndex],
				[findCardGroupState, cardGroupIndex],
				[findCardValueState, cardValuesIndex],
			]
			// biome-ignore lint/complexity/noForEach: for readability
			gameStateFamilies.forEach(([family, index]) => exposeFamily(family, index))

			const gameTransactions = [
				addCardValueTX,
				addHandTx,
				dealCardsTX,
				shuffleDeckTX,
				spawnCardTX,
				spawnClassicDeckTX,
			] as const
			// biome-ignore lint/complexity/noForEach: for readability
			gameTransactions.forEach(receiveTransaction)
		})
	},
)
