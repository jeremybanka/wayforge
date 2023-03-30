import { pipe } from "fp-ts/function"
import type { Socket, Server as WebSocketServer } from "socket.io"
import type { Socket as ClientSocket } from "socket.io-client"
import type { StoreApi } from "zustand/vanilla"
import { createStore } from "zustand/vanilla"

import type { Encapsulate } from "~/packages/anvl/src/function"
import { Join } from "~/packages/anvl/src/join"
import type {
  ErrorObject,
  Resource,
  ResourceIdentifierObject,
} from "~/packages/anvl/src/json-api"
import { ifDefined } from "~/packages/anvl/src/nullish"
import type { Fragment } from "~/packages/anvl/src/object"
import {
  redactDeep,
  isPlainObject,
  entriesToRecord,
  recordToEntries,
  patch,
  hasExactProperties,
} from "~/packages/anvl/src/object"
import { Dictionary } from "~/packages/anvl/src/object/dictionary"
import { isClass, isUnion } from "~/packages/anvl/src/refinement"
import type { Visibility } from "~/packages/obscurity/src"

export interface GameEntity extends Resource {
  id: string
  type: string
  attributes: { visibility: Visibility }
}

export type Player = {
  perspective: Dictionary<string, string, `trueId`, `virtualId`>
}
export const isPlayer = hasExactProperties({
  perspective: isClass(Dictionary),
})
export const createPerspective = (): Player[`perspective`] =>
  new Dictionary({ from: `trueId`, into: `virtualId` })

export const createPlayer = (): Player => ({
  perspective: createPerspective(),
})

export interface Card {
  rotation: number
}

export type CardGroup = Card

export type GameState = {
  players: Record<string, Player>
  cards: Record<string, Card>
  cardGroups: Record<string, CardGroup>
  cardsInGroups: Join
}

export type GameStore = StoreApi<GameState>

export const GAME_ACTIONS = [`ADD_PLAYER`] as const

export type GameActionPayload =
  | {
      options: any
      targets: Record<string, ResourceIdentifierObject>
    }
  | { options: any }
  | { targets: Record<string, ResourceIdentifierObject> }
export interface GameActions
  extends Record<
    GameActionType,
    (payload: GameActionPayload) => Fragment<GameState>
  > {
  ADD_PLAYER: (payload: {
    options: { id: string }
  }) => Pick<GameState, `players`>
}
export type GameActionType = (typeof GAME_ACTIONS)[number]

export const initGame = (): GameStore =>
  createStore<GameState>(() => ({
    players: {},
    cards: {},
    cardGroups: {},
    cardsInGroups: new Join(),
  }))

export const useActions = (
  store: GameStore
): { store: GameStore; actions: GameActions } => ({
  store,
  actions: {
    ADD_PLAYER: ({ options: { id } }) => ({
      players: {
        [id]: {
          perspective: createPerspective(),
        },
      },
    }),
  },
})

export const useDispatch = ({
  store,
  actions,
}: ReturnType<typeof useActions>): {
  store: GameStore
  actions: GameActions
  dispatch: <Key extends keyof GameActions>(
    action: Key,
    payload: Parameters<GameActions[Key]>[0]
  ) => Fragment<GameState>
} => ({
  store,
  actions,
  dispatch: (key, payload) => {
    const delta = actions[key](payload)
    store.setState((state) => patch(state, delta))
    return delta
  },
})

export type GameSocketError = ErrorObject<`title`>

export type ServeGameOptions = {
  logger: Pick<Console, `error` | `info` | `warn`>
  game: ReturnType<typeof useDispatch>
}

export type GameClientEvents = {
  [GameActionType in keyof GameActions]: Encapsulate<GameActions[GameActionType]>
}

export type GameServerEvents = {
  [GameActionType in keyof GameActions]: GameActions[GameActionType] extends (
    ...args: any[]
  ) => any
    ? (
        result:
          | Awaited<ReturnType<GameActions[GameActionType]>>
          | GameSocketError
      ) => void
    : never
}

export type GameServerSideEvents = Record<string, unknown>

export type GameClientSocket = ClientSocket<GameServerEvents, GameClientEvents>

export type GameSocketServer = WebSocketServer<
  GameClientEvents,
  GameServerEvents,
  GameServerSideEvents
>

export const serveGame =
  (options: ServeGameOptions) =>
  <YourServer extends WebSocketServer>(server: YourServer): YourServer =>
    server.on(
      `connection`,
      (
        socket: Socket<GameClientEvents, GameServerEvents, GameServerSideEvents>
      ) => {
        const { game, logger } = options

        const makeHandler = (key: GameActionType) => (payload: any) => {
          try {
            const result = game.dispatch(key, payload)
            console.info(result)
            socket.emit(key, redactDeep(`perspective`)(result as any) as any)
          } catch (thrown) {
            if (thrown instanceof Error) {
              logger.error(thrown.message)
              socket.emit(key, {
                type: `error`,
                title: thrown.message,
              })
            } else {
              throw thrown
            }
          }
        }

        const handle: GameClientEvents = pipe(
          game.actions,
          recordToEntries,
          (keys) => keys.map(([key]) => [key, makeHandler(key)] as const),
          entriesToRecord
        )

        socket.onAny((key: string, payload: unknown) => {
          logger.info(socket.id, key, payload)
          if (key in handle) {
            if (
              ifDefined(
                isUnion
                  .or(
                    hasExactProperties({
                      options: ifDefined(isPlainObject),
                    })
                  )
                  .or(
                    hasExactProperties({
                      targets: ifDefined(isPlainObject),
                    })
                  )
              )(payload)
            ) {
              handle[key as keyof GameClientEvents](payload as any)
            } else {
              logger.error(`Invalid payload for ${key}: ${payload}`)
            }
          } else {
            logger.error(`Unknown event type: ${key}`)
          }
        })
      }
    )
