import * as AtomIO from "atom.io"
import * as RT from "atom.io/realtime"
import dotenv from "dotenv"
import { pipe } from "fp-ts/function"
import { Server as WebSocketServer } from "socket.io"

import type { RelationData } from "~/packages/anvl/src/join/core-relation-data"
import type { JsonObj } from "~/packages/anvl/src/json"

import { logger } from "./logger"
import {
	add52ClassicCardsTX,
	addCardValueTX,
	addHandTx,
	cardGroupIndex,
	cardIndex,
	cardValuesIndex,
	spawnClassicDeckTX,
	findCardGroupState,
	findCardState,
	findCardValueState,
	spawnCardTX,
	dealCardsTX,
	shuffleDeckTX,
	cardIndexJSON,
	cardGroupIndexJSON,
	cardValuesIndexJSON,
	groupsAndZonesOfCardCyclesStateJSON,
	groupsOfCardsStateJSON,
	ownersOfCardsStateJSON,
	ownersOfGroupsStateJSON,
	valuesOfCardsStateJSON,
} from "./store/game"
import type { JoinRoomIO } from "./store/rooms"
import {
	createRoomTX,
	findPlayersInRoomState,
	joinRoomTX,
	leaveRoomTX,
	playersInRoomsState,
	playersIndex,
	roomsIndex,
	roomsIndexJSON,
} from "./store/rooms"

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
			AtomIO.setState(
				playersIndex,
				(playersIndex) => new Set([...playersIndex, socket.id]),
			)
			socket.on(`disconnect`, () => {
				AtomIO.setState(
					playersIndex,
					(playersIndex) =>
						new Set([...playersIndex].filter((id) => id !== socket.id)),
				)
				AtomIO.setState(playersInRoomsState, (current) =>
					current.remove({ playerId: socket.id }),
				)
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
			const exposeFamily = RT.useExposeFamily({ socket })
			const receiveTransaction = RT.useReceiveTransaction({ socket })

			// ROOM SERVICES
			exposeSingle<string[]>(roomsIndexJSON)
			exposeFamily<
				{ id: string; enteredAt: number }[]
			>(findPlayersInRoomState, roomsIndex)
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
					const unsubscribeFromPlayersInRoom = AtomIO.subscribe(
						findPlayersInRoomState(roomId),
						({ newValue }) => {
							socket.emit(`set:playersInRoom:${roomId}`, [...newValue])
						},
					)
					socket.on(`tx:leaveRoom`, () => {
						AtomIO.runTransaction(leaveRoomTX)({ roomId, playerId: socket.id })
						socket.leave(roomId)
						unsubscribeFromPlayersInRoom()
					})
				},
			)

			// GAME SERVICES
			const gameStateFamilies: [
				AtomIO.AtomFamily<JsonObj>,
				AtomIO.StateToken<Set<string>>,
			][] = [
				[findCardState, cardIndex],
				[findCardGroupState, cardGroupIndex],
				[findCardValueState, cardValuesIndex],
			]
			gameStateFamilies.forEach(([family, index]) => exposeFamily(family, index))

			const gameIndices: AtomIO.StateToken<string[]>[] = [
				cardIndexJSON,
				cardGroupIndexJSON,
				cardValuesIndexJSON,
			]
			gameIndices.forEach(exposeSingle)

			const gameJoinStates: AtomIO.StateToken<RelationData<any, any, any>>[] = [
				groupsAndZonesOfCardCyclesStateJSON,
				groupsOfCardsStateJSON,
				ownersOfCardsStateJSON,
				ownersOfGroupsStateJSON,
				valuesOfCardsStateJSON,
			]
			gameJoinStates.forEach(exposeSingle)

			const gameTransactions = [
				add52ClassicCardsTX,
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
