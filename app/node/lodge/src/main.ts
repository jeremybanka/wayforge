import * as AtomIO from "atom.io"
import dotenv from "dotenv"
import { pipe } from "fp-ts/function"
import type { Socket } from "socket.io"
import { Server as WebSocketServer } from "socket.io"

import type { JsonInterface } from "~/packages/anvl/src/json"
import type { TransactionUpdate } from "~/packages/atom.io/src/internal"

import { logger } from "./logger"
import {
  createRoom,
  findPlayersInRoomState,
  joinRoom,
  leaveRoom,
  playersInRoomsState,
  playersIndex,
  roomsIndex,
} from "./store/rooms"

// setLogLevel(`info`)

const record: Record<string, string> = {}
const serve = <T>(
  socket: Socket,
  token: AtomIO.StateToken<T>,
  transform: JsonInterface<T>
) => {
  // socket.emit(`set:${token.key}`, transform.toJson(AtomIO.getState(token)))
  socket.on(`sub:${token.key}`, () => {
    logger.info(socket.id, `sub:${token.key}`)
    socket.emit(`serve:${token.key}`, transform.toJson(AtomIO.getState(token)))
    const unsubscribeFromPlayersInRoom = AtomIO.subscribe(
      token,
      ({ newValue }) => {
        socket.emit(`serve:${token.key}`, transform.toJson(newValue))
      }
    )
    socket.on(`unsub:${token.key}`, () => {
      logger.info(socket.id, `unsub:${token.key}`)
      unsubscribeFromPlayersInRoom()
    })
  })
}

const serveFamily = <T>(
  socket: Socket,
  family: AtomIO.AtomFamily<T> | AtomIO.SelectorFamily<T>,
  transform: JsonInterface<T>
) => {
  socket.on(`sub:${family.key}`, (subKey: AtomIO.Serializable) => {
    logger.info(socket.id, `sub:${family.key}`, subKey)
    const token = family(subKey)
    socket.emit(`serve:${token.key}`, transform.toJson(AtomIO.getState(token)))
    const unsubscribe = AtomIO.subscribe(token, ({ newValue }) => {
      socket.emit(`serve:${token.key}`, transform.toJson(newValue))
    })
    socket.on(`unsub:${token.key}`, () => {
      logger.info(socket.id, `unsub:${token.key}`)
      unsubscribe()
    })
  })
}

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
      socket.emit(`set:roomsIndex`, [...AtomIO.getState(roomsIndex)])
      logger.info(socket.id, `connected`)
      io.emit(`connection`)
      AtomIO.setState(
        playersIndex,
        (playersIndex) => new Set([...playersIndex, socket.id])
      )
      const unsubRoomsIndex = AtomIO.subscribe(roomsIndex, ({ newValue }) => {
        socket.emit(`set:roomsIndex`, [...newValue])
      })
      socket.on(`new:room`, (update: TransactionUpdate<() => string>) => {
        logger.info(socket.id, `new:room`, update.output)
        AtomIO.runTransaction(createRoom)(update.output)
      })

      serveFamily(socket, findPlayersInRoomState, {
        fromJson: (json) => json,
        toJson: (value) => value,
      })

      // join:room

      socket.on(
        `join:room`,
        (
          update: TransactionUpdate<
            (options: { roomId: string; playerId: string }) => void
          >
        ) => {
          const { roomId, playerId } = update.params[0]
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

          AtomIO.runTransaction(joinRoom)(...update.params)

          socket.join(roomId)
          const unsubscribeFromPlayersInRoom = AtomIO.subscribe(
            findPlayersInRoomState(roomId),
            ({ newValue }) => {
              socket.emit(`set:playersInRoom:${roomId}`, [...newValue])
            }
          )

          socket.on(`leave:room`, () => {
            logger.info(socket.id, `leave:room`, roomId)
            AtomIO.runTransaction(leaveRoom)({ roomId, playerId: socket.id })
            socket.leave(roomId)
            unsubscribeFromPlayersInRoom()
          })
        }
      )

      // disconnect

      socket.on(`disconnect`, () => {
        logger.info(socket.id, `disconnected`)
        AtomIO.setState(
          playersIndex,
          (playersIndex) =>
            new Set([...playersIndex].filter((id) => id !== socket.id))
        )
        AtomIO.setState(playersInRoomsState, (current) =>
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
