import * as AtomIO from "atom.io"
import { IMPLICIT, getUpdateToken } from "atom.io/internal"
import * as RTS from "atom.io/realtime-server"
import dotenv from "dotenv"
import { pipe } from "fp-ts/function"
import { Server as WebSocketServer } from "socket.io"

import { logger } from "./logger"
import {
	addCardValueTX,
	addHandTX,
	cardCycleGroupsAndZones,
	cardIndex,
	cardValuesIndex,
	dealCardsTX,
	findCardState,
	findCardValueState,
	shuffleDeckTX,
	spawnCardTX,
	spawnClassicDeckTX,
	valuesOfCards,
} from "./store/game"
import * as CardGroups from "./store/game/card-groups"
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
const store = IMPLICIT.STORE

const TIMESTAMP = Date.now()

dotenv.config()
pipe(
	new WebSocketServer(3333, {
		cors: {
			origin: [`http://eris.local:4500`, `http://localhost:4500`],
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
			const receiveTransaction = RTS.useReceiveTransaction({ socket, store })

			// ROOM SERVICES
			exposeMutable(roomsIndex)
			exposeMutableFamily(playersInRooms.core.findRelatedKeysState, roomsIndex)
			socket.on(
				`tx-run:createRoom`,
				(update: AtomIO.TransactionUpdate<() => string>) => {
					AtomIO.runTransaction(createRoomTX)(update.output)
				},
			)
			socket.on(
				`tx-run:joinRoom`,
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

					// GAME SERVICES

					// Indices
					exposeMutable(cardIndex)
					exposeMutable(cardValuesIndex)
					const deckIndex = AtomIO.findState(CardGroups.deckIndices, roomId)
					const handIndex = AtomIO.findState(CardGroups.handIndices, roomId)
					const pileIndex = AtomIO.findState(CardGroups.pileIndices, roomId)
					const trickIndex = AtomIO.findState(CardGroups.trickIndices, roomId)
					const cardGroupIndex = AtomIO.findState(CardGroups.indices, roomId)
					exposeMutable(deckIndex)
					exposeMutable(handIndex)
					exposeMutable(pileIndex)
					exposeMutable(trickIndex)

					// Families
					exposeFamily(findCardState, cardIndex)
					exposeFamily(CardGroups.deckStates, deckIndex)
					exposeFamily(CardGroups.handStates, handIndex)
					exposeFamily(CardGroups.pileStates, pileIndex)
					exposeFamily(CardGroups.trickStates, trickIndex)
					exposeFamily(findCardValueState, cardValuesIndex)

					// Relations
					const groupsOfCardsFamily =
						CardGroups.groupsOfCards.core.findRelatedKeysState
					const ownersOfGroupsFamily =
						CardGroups.ownersOfGroups.core.findRelatedKeysState
					const valuesOfCardsFamily = valuesOfCards.core.findRelatedKeysState
					const cardCycleGZFamily =
						cardCycleGroupsAndZones.core.findRelatedKeysState
					exposeMutableFamily(groupsOfCardsFamily, cardGroupIndex)
					exposeMutableFamily(groupsOfCardsFamily, cardIndex)
					exposeMutableFamily(ownersOfGroupsFamily, cardGroupIndex)
					exposeMutableFamily(ownersOfGroupsFamily, cardIndex)
					exposeMutableFamily(valuesOfCardsFamily, cardValuesIndex)
					exposeMutableFamily(valuesOfCardsFamily, cardIndex)
					exposeMutableFamily(cardCycleGZFamily, cardGroupIndex)
					exposeMutableFamily(cardCycleGZFamily, cardIndex)

					// Transactions
					receiveTransaction(addCardValueTX)
					receiveTransaction(addHandTX)
					receiveTransaction(dealCardsTX)
					receiveTransaction(shuffleDeckTX)
					receiveTransaction(spawnCardTX)
					receiveTransaction(spawnClassicDeckTX)

					socket.on(`tx:leaveRoom`, () => {
						AtomIO.runTransaction(leaveRoomTX)({ roomId, playerId: socket.id })
						socket.leave(roomId)
						unsubscribeFromPlayersInRoomTracker()
					})
				},
			)
		})
	},
)
