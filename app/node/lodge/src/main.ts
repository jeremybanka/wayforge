import * as AtomIO from "atom.io"
import dotenv from "dotenv"
import { pipe } from "fp-ts/function"
import type { Socket } from "socket.io"
import { Server as WebSocketServer } from "socket.io"

import { Join } from "~/packages/anvl/src/join"
import type { JsonInterface } from "~/packages/anvl/src/json"
import { parseJson, stringSetJsonInterface } from "~/packages/anvl/src/json"
import type { TransactionUpdate } from "~/packages/atom.io/src/internal"

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
  groupsAndZonesOfCardCyclesState,
  groupsOfCardsState,
  ownersOfCardsState,
  ownersOfGroupsState,
  spawnCardTX,
  valuesOfCardsState,
  dealCardsTX,
  shuffleDeckTX,
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
} from "./store/rooms"

export const serve = <T>(
  socket: Socket,
  token: AtomIO.StateToken<T>,
  transform: JsonInterface<T>
): void => {
  socket.on(`sub:${token.key}`, () => {
    socket.emit(`serve:${token.key}`, transform.toJson(AtomIO.getState(token)))
    const unsubscribe = AtomIO.subscribe(token, ({ newValue }) => {
      socket.emit(`serve:${token.key}`, transform.toJson(newValue))
    })
    socket.on(`unsub:${token.key}`, () => {
      // socket.emit(`unsub:${token.key}`)
      unsubscribe()
    })
  })
}

const serveFamily = <T>(
  socket: Socket,
  family: AtomIO.AtomFamily<T> | AtomIO.SelectorFamily<T>,
  index: AtomIO.StateToken<Set<string>>,
  transform: JsonInterface<T>
) => {
  socket.on(`sub:${family.key}`, (subKey?: AtomIO.Serializable) => {
    if (subKey === undefined) {
      const keys = AtomIO.getState(index)
      keys.forEach((key) => {
        const token = family(key)
        socket.emit(
          `serve:${token.key}`,
          transform.toJson(AtomIO.getState(token))
        )
      })

      const subscription =
        family.type === `atom_family`
          ? family.subject.subscribe((token) => {
              AtomIO.subscribe(token, ({ newValue }) => {
                socket.emit(
                  `serve:${family.key}`,
                  parseJson(token.family?.subKey || `null`),
                  transform.toJson(newValue)
                )
              })
            })
          : family.subject.subscribe((token) => {
              AtomIO.subscribe(token, ({ newValue }) => {
                socket.emit(
                  `serve:${family.key}`,
                  parseJson(token.family?.subKey || `null`),
                  transform.toJson(newValue)
                )
              })
            })

      socket.on(`unsub:${family.key}`, () => {
        subscription.unsubscribe()
      })
    } else {
      const token = family(subKey)
      socket.emit(`serve:${token.key}`, transform.toJson(AtomIO.getState(token)))
      const unsubscribe = AtomIO.subscribe(token, ({ newValue }) => {
        socket.emit(`serve:${token.key}`, transform.toJson(newValue))
      })
      socket.on(`unsub:${token.key}`, () => {
        socket.emit(`unsub:${token.key}`)
        unsubscribe()
      })
    }
  })
}

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
      logger.info(socket.id, `connected`)
      io.emit(`connection`, TIMESTAMP)
      AtomIO.setState(
        playersIndex,
        (playersIndex) => new Set([...playersIndex, socket.id])
      )
      socket.onAny((event, ...args) => {
        logger.info(`${socket.id}`, event, ...args)
      })
      socket.onAnyOutgoing((event, ...args) => {
        if (JSON.stringify(args).length > 1000) {
          const summary = {
            string: JSON.stringify(args).slice(0, 10) + `...`,
          }[typeof args[0]]
          logger.info(`${socket.id} <<`, event, summary, `...`)
          return
        }
        logger.info(`${socket.id} <<`, event, ...args)
      })

      serve(socket, roomsIndex, stringSetJsonInterface)
      serveFamily(socket, findPlayersInRoomState, roomsIndex, {
        fromJson: (json) => json,
        toJson: (value) => value,
      })

      const gameStateFamilies = [
        [findCardState, cardIndex],
        [findCardGroupState, cardGroupIndex],
        [findCardValueState, cardValuesIndex],
      ] as const
      gameStateFamilies.forEach(([family, index]) => {
        serveFamily(socket, family, index, {
          fromJson: (json) => json,
          toJson: (value) => value,
        })
      })
      const gameIndices = [cardIndex, cardGroupIndex, cardValuesIndex]
      gameIndices.forEach((index) => {
        serve(socket, index, stringSetJsonInterface)
      })
      const gameJoinStates = [
        groupsAndZonesOfCardCyclesState,
        groupsOfCardsState,
        ownersOfCardsState,
        ownersOfGroupsState,
        valuesOfCardsState,
      ]
      gameJoinStates.forEach((join) =>
        serve(socket, join, {
          toJson: (j) => j.toJSON(),
          fromJson: (json) => new Join(json as any),
        })
      )
      const gameTransactions = [
        add52ClassicCardsTX,
        addCardValueTX,
        addHandTx,
        dealCardsTX,
        shuffleDeckTX,
        spawnCardTX,
        spawnClassicDeckTX,
      ]
      gameTransactions.forEach((tx) => {
        socket.on(
          `tx:${tx.key}`,
          <ƒ extends AtomIO.ƒn>(update: TransactionUpdate<ƒ>) => {
            AtomIO.runTransaction<ƒ>(tx)(...update.params)
          }
        )
      })

      socket.on(`tx:createRoom`, (update: TransactionUpdate<() => string>) => {
        AtomIO.runTransaction(createRoomTX)(update.output)
      })
      socket.on(`tx:joinRoom`, (update: TransactionUpdate<JoinRoomIO>) => {
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
          }
        )
        socket.on(`tx:leaveRoom`, () => {
          AtomIO.runTransaction(leaveRoomTX)({ roomId, playerId: socket.id })
          socket.leave(roomId)
          unsubscribeFromPlayersInRoom()
        })
      })

      socket.on(`disconnect`, () => {
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
