import dotenv from "dotenv"
import { pipe } from "fp-ts/function"
import { current } from "immer"
import { Server as WebSocketServer } from "socket.io"

import {
  getState,
  runTransaction,
  setLogLevel,
  setState,
  subscribe,
} from "~/packages/atom.io/src"
import type { TransactionUpdate } from "~/packages/atom.io/src/internal"

import { logger } from "./logger"
import {
  createRoom,
  findPlayersInRoomState,
  joinRoom,
  playersInRoomsState,
  playersIndex,
  roomsIndex,
} from "./store/rooms"

// setLogLevel(`info`)

const record: Record<string, string> = {}

subscribe(playersInRoomsState, ({ newValue, oldValue }) => {
  logger.info(`playersInRoomsState`, `oldValue`, oldValue.toJSON().relations)
  logger.info(`playersInRoomsState`, `newValue`, newValue.toJSON().relations)
})

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
      socket.emit(`set:roomsIndex`, [...getState(roomsIndex)])
      logger.info(socket.id, `connected`)
      io.emit(`connection`)
      setState(
        playersIndex,
        (playersIndex) => new Set([...playersIndex, socket.id])
      )
      const unsubRoomsIndex = subscribe(roomsIndex, ({ newValue }) => {
        socket.emit(`set:roomsIndex`, [...newValue])
      })
      socket.on(`new:room`, (update: TransactionUpdate<() => string>) => {
        logger.info(socket.id, `new:room`, update.output)
        runTransaction(createRoom)(update.output)
      })
      socket.on(`get:playersInRoom`, (roomId: string) => {
        logger.info(socket.id, `get:playersInRoom`, roomId)
        socket.emit(`set:playersInRoom:${roomId}`, [
          ...getState(findPlayersInRoomState(roomId)),
        ])
      })

      socket.on(`sub:playersInRoom`, (roomId: string) => {
        logger.info(socket.id, `sub:playersInRoom`, roomId)
        socket.emit(`set:playersInRoom:${roomId}`, [
          ...getState(findPlayersInRoomState(roomId)),
        ])
        const unsubscribeFromPlayersInRoom = subscribe(
          findPlayersInRoomState(roomId),
          ({ newValue }) => {
            socket.emit(`set:playersInRoom:${roomId}`, [...newValue])
          }
        )
        socket.on(`unsub:playersInRoom`, () => {
          logger.info(socket.id, `unsub:playersInRoom`, roomId)
          unsubscribeFromPlayersInRoom()
        })
      })

      // join:room

      socket.on(
        `join:room`,
        (
          update: TransactionUpdate<(roomId: string, socketId: string) => void>
        ) => {
          const [roomId, playerId] = update.params
          logger.info(socket.id, `join:room`, roomId)
          if (playerId !== socket.id) {
            logger.error(
              socket.id,
              `join:room`,
              `playerId`,
              playerId,
              `does not match socket.id`
            )
          }
          runTransaction(joinRoom)(...update.params)
          socket.emit(`set:playersInRoom:${roomId}`, [
            ...getState(findPlayersInRoomState(roomId)),
          ])
          socket.join(roomId)
          const unsubscribeFromPlayersInRoom = subscribe(
            findPlayersInRoomState(roomId),
            ({ newValue }) => {
              socket.emit(`set:playersInRoom:${roomId}`, [...newValue])
            }
          )
          socket.on(`leave:room`, () => {
            logger.info(socket.id, `leave:room`, roomId)
            socket.leave(roomId)
            unsubscribeFromPlayersInRoom()
          })
        }
      )

      // disconnect

      socket.on(`disconnect`, () => {
        logger.info(socket.id, `disconnected`)
        setState(
          playersIndex,
          (playersIndex) =>
            new Set([...playersIndex].filter((id) => id !== socket.id))
        )
        setState(playersInRoomsState, (current) =>
          current.remove({ playerId: socket.id })
        )
      })
    })
  }
)

logger.info(
  `   `,
  `|¯\\_________________________________|¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯\\_|`
)
logger.info(``, ``)

logger.info(
  `[/]`,
  `|__________________________/ `,
  `▓▓   ▓▓   ▓▓`,
  ` \\___________________________|`
)
logger.info(`[/]`, `                             `, `▓▓   ▓▓   ▓▓`)
logger.info(
  `[/]`,
  `  00                         `,
  `▓▓   ▓▓   ▓▓`,
  `              WAYFORGE : LODGE`
)
logger.info(`[/]`, `                             `, `▓▓        ▓▓`)
logger.info(
  `[/]`,
  `|¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯\\ `,
  `▓▓▓▓▓▓▓▓▓▓▓▓`,
  ` /¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯|`
)
logger.info(``, ``)
logger.info(
  `   `,
  `|_/¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯|_________________________________/¯|`
)
