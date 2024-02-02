import * as AtomIO from "atom.io"
import { IMPLICIT, findInStore, getUpdateToken } from "atom.io/internal"
import * as RTS from "atom.io/realtime-server"
import { pipe } from "fp-ts/function"
import * as SocketIO from "socket.io"

import { env } from "./env"
import { logger } from "./logger"
import {
	cardCycleGroupsAndZones,
	cardIndex,
	cardValuesIndex,
	dealCardsTX,
	findCardState,
	findCardValueState,
	shuffleDeckTX,
	spawnClassicDeckTX,
	spawnHandTX,
	spawnTrickTX,
	valuesOfCards,
} from "./store/game"
import * as CardGroups from "./store/game/card-game-stores/card-groups-store"
import { startGameTX } from "./store/game/hearts"
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

pipe(
	new SocketIO.Server(env.PORT, { cors: { origin: env.CLIENT_ORIGINS } }),
	(server) => {
		server.use((socket, next) => {
			const { token, username } = socket.handshake.auth
			const shortId = socket.id.slice(0, 3)
			if (token === `test` && socket.id) {
				const socketState = AtomIO.findState(RTS.socketAtoms, socket.id)
				AtomIO.setState(socketState, socket)
				RTS.usersOfSockets.relations.set(socket.id, username)
				AtomIO.setState(RTS.userIndex, (index) => index.add(username))
				AtomIO.setState(RTS.socketIndex, (index) => index.add(socket.id))
				AtomIO.setState(playersIndex, (ids) => ids.add(socket.id))
				logger.info(`[${shortId}]:${username}`, `connected`)
				next()
			} else {
				logger.info(`[${shortId}]:???`, `couldn't authenticate as "${username}"`)
				next(new Error(`Authentication error`))
			}
		})
		return server
	},
	(server) => {
		server.on(`connection`, (socket) => {
			// WELCOME
			const shortId = socket.id.slice(0, 3)
			const userKeyState = AtomIO.findState(
				RTS.usersOfSockets.states.userKeyOfSocket,
				socket.id,
			)
			const userKey = AtomIO.getState(userKeyState)
			if (!userKey) throw new Error(`User not found`)
			server.emit(`connection`, TIMESTAMP)
			socket.on(`disconnect`, () => {
				AtomIO.setState(playersIndex, (ids) => (ids.delete(socket.id), ids))
				AtomIO.setState(RTS.userIndex, (ids) => (ids.delete(userKey), ids))
				AtomIO.setState(RTS.socketIndex, (ids) => (ids.delete(socket.id), ids))
				RTS.usersOfSockets.relations.delete(socket.id)
				playersInRooms.relations.delete({ player: socket.id })
				logger.info(`[${shortId}]:${userKey}`, `disconnected`)
			})

			// LOGGING
			socket.onAny((event, ...args) => {
				logger.info(`[${shortId}] ${userKey}`, event, ...args)
			})
			socket.onAnyOutgoing((event, ...args) => {
				if (JSON.stringify(args).length > 1000) {
					const summary = {
						string: `${JSON.stringify(args).slice(0, 10)}...`,
					}[typeof args[0]]
					logger.info(`[${shortId}]:${userKey} <<`, event, summary, `...`)
					return
				}
				logger.info(`[${shortId}]:${userKey} <<`, event, ...args)
			})

			// COMPOSE REALTIME SERVICE HOOKS
			const exposeSingle = RTS.realtimeStateProvider({ socket })
			const exposeMutable = RTS.realtimeMutableProvider({ socket })
			const exposeFamily = RTS.realtimeAtomFamilyProvider({ socket })
			const exposeMutableFamily = RTS.realtimeMutableFamilyProvider({ socket })
			const receiveTransaction = RTS.realtimeActionReceiver({ socket, store })
			const syncTransaction = RTS.realtimeActionSynchronizer({ socket, store })

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
					exposeMutableFamily(
						playersInRooms.core.findRelatedKeysState,
						playersInRoomState,
					)

					// GAME SERVICES

					// Indices
					exposeMutable(cardIndex)
					exposeMutable(cardValuesIndex)
					exposeMutable(CardGroups.deckIndex)
					exposeMutable(CardGroups.handIndex)
					exposeMutable(CardGroups.pileIndex)
					exposeMutable(CardGroups.trickIndex)

					// Families
					exposeFamily(findCardState, cardIndex)
					exposeFamily(CardGroups.deckStates, CardGroups.deckIndex)
					exposeFamily(CardGroups.handStates, CardGroups.handIndex)
					exposeFamily(CardGroups.pileStates, CardGroups.pileIndex)
					exposeFamily(CardGroups.trickStates, CardGroups.trickIndex)
					exposeFamily(findCardValueState, cardValuesIndex)

					// Relations
					const groupsOfCardsFamily =
						CardGroups.groupsOfCards.core.findRelatedKeysState
					const ownersOfGroupsFamily =
						CardGroups.ownersOfGroups.core.findRelatedKeysState
					const valuesOfCardsFamily = valuesOfCards.core.findRelatedKeysState
					const cardCycleGZFamily =
						cardCycleGroupsAndZones.core.findRelatedKeysState
					exposeMutableFamily(groupsOfCardsFamily, CardGroups.cardGroupIndex)
					exposeMutableFamily(groupsOfCardsFamily, cardIndex)
					exposeMutableFamily(ownersOfGroupsFamily, CardGroups.cardGroupIndex)
					exposeMutableFamily(ownersOfGroupsFamily, cardIndex)
					exposeMutableFamily(valuesOfCardsFamily, cardValuesIndex)
					exposeMutableFamily(valuesOfCardsFamily, cardIndex)
					exposeMutableFamily(cardCycleGZFamily, CardGroups.cardGroupIndex)
					exposeMutableFamily(cardCycleGZFamily, cardIndex)

					// Transactions
					receiveTransaction(spawnHandTX)
					receiveTransaction(dealCardsTX)
					receiveTransaction(shuffleDeckTX)
					receiveTransaction(spawnClassicDeckTX)
					receiveTransaction(spawnTrickTX)
					syncTransaction(startGameTX)

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
