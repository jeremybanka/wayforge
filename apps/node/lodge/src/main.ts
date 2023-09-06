import * as AtomIO from "atom.io"
import * as RT from "atom.io/realtime"
import dotenv from "dotenv"
import { pipe } from "fp-ts/function"
import { Server as WebSocketServer } from "socket.io"

import { MutableAtomToken, getTrackerToken } from "atom.io/mutable"
import type { RelationData } from "~/packages/anvl/src/join/core-relation-data"
import type { Json } from "~/packages/anvl/src/json"

import { TransceiverSet } from "~/packages/anvl/reactivity"
import { logger } from "./logger"
import {
	addCardValueTX,
	addHandTx,
	cardGroupIndex,
	cardIndex,
	cardValuesIndex,
	dealCardsTX,
	findCardGroupState,
	findCardState,
	findCardValueState,
	groupsAndZonesOfCardCyclesStateJSON,
	groupsOfCards,
	ownersOfCardsStateJSON,
	ownersOfGroups,
	shuffleDeckTX,
	spawnCardTX,
	spawnClassicDeckTX,
} from "./store/game"
import type { JoinRoomIO } from "./store/rooms"
import {
	createRoomTX,
	joinRoomTX,
	leaveRoomTX,
	playersInRooms,
	playersIndex,
	roomsIndex,
	roomsIndexJSON,
} from "./store/rooms"
import { AtomicJunction } from "./store/utils/atomic-junction"

const TIMESTAMP = Date.now()

dotenv.config()
pipe(
	new WebSocketServer(3333, {
		cors: {
			origin: `http://localhost:5173`,
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
				playersInRooms.delete({ playerId: socket.id })
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
			const exposeSingle = RT.useExposeSingle({ socket })
			const exposeMutable = RT.useExposeMutable({ socket })
			const exposeFamily = RT.useExposeFamily({ socket })
			const exposeMutableFamily = RT.useExposeMutableFamily({ socket })
			const receiveTransaction = RT.useReceiveTransaction({ socket })

			// ROOM SERVICES
			exposeSingle<string[]>(roomsIndexJSON)
			exposeMutableFamily(
				playersInRooms.findRelationsState__INTERNAL,
				roomsIndex,
			)
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
						playersInRooms.findRelationsState__INTERNAL(roomId)
					const playersInRoomTrackerToken = getTrackerToken(playersInRoomState)
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

			const gameIndices: MutableAtomToken<TransceiverSet<string>, string[]>[] = [
				cardIndex,
				cardGroupIndex,
				cardValuesIndex,
			]
			gameIndices.forEach(exposeMutable)

			const gameJoinStates: AtomIO.StateToken<RelationData<any, any, any>>[] = [
				groupsAndZonesOfCardCyclesStateJSON,
				ownersOfCardsStateJSON,
			]
			gameJoinStates.forEach(exposeSingle)
			const gameRelations: [
				junction: AtomicJunction<any, any, any>,
				indexA: MutableAtomToken<TransceiverSet<string>, string[]>,
				indexB: MutableAtomToken<TransceiverSet<string>, string[]>,
			][] = [
				[groupsOfCards, cardGroupIndex, cardIndex],
				[ownersOfGroups, playersIndex, cardGroupIndex],
			]
			gameRelations.forEach(([junction, indexA, indexB]) => {
				exposeMutableFamily(junction.findRelationsState__INTERNAL, indexA)
				exposeMutableFamily(junction.findRelationsState__INTERNAL, indexB)
				if (junction.findRelationContentState__INTERNAL) {
					// exposeFamily(junction.findRelationContentState__INTERNAL)
				}
			})

			const gameStateFamilies: [
				AtomIO.AtomFamily<Json.Object>,
				AtomIO.StateToken<Set<string>>,
			][] = [
				[findCardState, cardIndex],
				[findCardGroupState, cardGroupIndex],
				[findCardValueState, cardValuesIndex],
			]
			gameStateFamilies.forEach(([family, index]) => exposeFamily(family, index))

			const gameTransactions = [
				addCardValueTX,
				addHandTx,
				dealCardsTX,
				shuffleDeckTX,
				spawnCardTX,
				spawnClassicDeckTX,
			] as const
			gameTransactions.forEach(receiveTransaction)
		})
	},
)

logger.info(
	`   `,
	`|¯\\_________________________________|¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯\\_|`,
)
logger.info(``, ``)

logger.info(
	`[/]`,
	`|__________________________/ `,
	`▓▓   ▓▓   ▓▓`,
	` \\___________________________|`,
)
logger.info(`[/]`, `                             `, `▓▓   ▓▓   ▓▓`)
logger.info(
	`[/]`,
	`  00                         `,
	`▓▓   ▓▓   ▓▓`,
	`              WAYFORGE : LODGE`,
)
logger.info(`[/]`, `                             `, `▓▓        ▓▓`)
logger.info(
	`[/]`,
	`|¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯\\ `,
	`▓▓▓▓▓▓▓▓▓▓▓▓`,
	` /¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯|`,
)
logger.info(``, ``)
logger.info(
	`   `,
	`|_/¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯|_________________________________/¯|`,
)
