import { flow, pipe } from "fp-ts/function"
import { isString } from "fp-ts/lib/string"
import type { Socket, Server as WebSocketServer } from "socket.io"
import type { Socket as ClientSocket } from "socket.io-client"

import { map } from "~/packages/anvl/src/array"
import type { Encapsulate } from "~/packages/anvl/src/function"
import type {
  ErrorObject,
  ResourceIdentifierObject,
} from "~/packages/anvl/src/json-api"
import { isResourceIdentifier } from "~/packages/anvl/src/json-api"
import {
  redactDeep,
  entriesToRecord,
  recordToEntries,
  doesExtend,
  isPlainObject,
  isRecord,
} from "~/packages/anvl/src/object"
import { isLiteral } from "~/packages/anvl/src/refinement"
import type { TrueIdentifier } from "~/packages/occlusion/src"

import type {
  GameActionKey,
  GameActionKeyWrapped,
  GameActions,
  StatusEventKey,
  StatusEvents,
  useDispatch,
} from "./store/game"
import { unwrapGameActionKey, wrapGameActionKey, refineSignal } from "./store/game"

export type GameSocketError = ErrorObject<`title`>

export type GameClientActionEvents = {
  [Key in GameActionKey as `ACTION:${Key}`]: Encapsulate<GameActions[Key]>
}
export type GameClientStatusEvents = {
  [Key in StatusEventKey as `STATUS:${Key}`]: Encapsulate<StatusEvents[Key]>
}
export type GameClientEvents = GameClientActionEvents & GameClientStatusEvents

export type GameServerEvents = {
  [Key in GameActionKey as `ACTION:${Key}`]: GameActions[Key] extends (
    ...args: any[]
  ) => any
    ? (result: Awaited<ReturnType<GameActions[Key]>> | GameSocketError) => void
    : never
}

export type GameServerSideEvents = Record<string, unknown>

export type GameClientSocket = ClientSocket<GameServerEvents, GameClientEvents>

export type GameSocketServer = WebSocketServer<
  GameClientEvents,
  GameServerEvents,
  GameServerSideEvents
>

export type ServeGameOptions = {
  logger: Pick<Console, `error` | `info` | `warn`>
  game: ReturnType<typeof useDispatch>
}

export const serveGame =
  (options: ServeGameOptions) =>
  <YourServer extends WebSocketServer>(server: YourServer): YourServer =>
    server.on(
      `connection`,
      (
        socket: Socket<GameClientEvents, GameServerEvents, GameServerSideEvents>
      ) => {
        const { game, logger } = options

        const makeHandler =
          (wrappedKey: GameActionKeyWrapped) => (payload: any) => {
            try {
              const key = unwrapGameActionKey(wrappedKey)
              const result = game.dispatch(key, payload)
              console.info(result)
              socket.emit(
                wrappedKey,
                redactDeep(`perspective`)(result as any) as any
              )
            } catch (thrown) {
              if (thrown instanceof Error) {
                logger.error(thrown.message)
                socket.emit(wrappedKey, {
                  type: `error`,
                  title: thrown.message,
                })
              } else {
                throw thrown
              }
            }
          }

        const handleAction: GameClientActionEvents = pipe(
          game.actions,
          recordToEntries,
          map(
            flow(
              ([key]) => key,
              wrapGameActionKey,
              (wrappedKey) => [wrappedKey, makeHandler(wrappedKey)] as const
            )
          ),
          entriesToRecord
        )
        const handleStatus: GameClientStatusEvents = {
          "STATUS:FOCUS": (payload) => logger.info(`FOCUS`, payload),
          "STATUS:EMOTE": (payload) => logger.info(`EMOTE`, payload),
          "STATUS:MESSAGE": (payload) => logger.info(`MESSAGE`, payload),
        }

        socket.onAny((signal: string, payload: unknown) => {
          logger.info(socket.id, signal, payload)

          const refined = refineSignal(signal)

          if (`action` in refined) {
            if (doesExtend({ id: isString })(payload)) {
              const {
                id,
                targets: virtualTargets,
                options,
              } = {
                targets: {},
                options: {},
                ...payload,
              }
              const trueTargets: Record<
                string,
                ResourceIdentifierObject<any, true>
              > = isRecord(isString, isResourceIdentifier)(virtualTargets)
                ? pipe(
                    virtualTargets,
                    recordToEntries,
                    map(([key, { id: virtualId, type }]) => {
                      const state = game.store.getState()
                      const { perspective } = state.players[socket.id]
                      return [
                        key,
                        {
                          id: perspective.getPairOf({ virtualId }).trueId,
                          type,
                        },
                      ] as const
                    }),
                    entriesToRecord
                  )
                : {}
              const { action: wrappedKey } = refined
              const newPayload = {
                id,
                targets: trueTargets,
                options,
              }
              handleAction[wrappedKey](newPayload as any)
            }
          } else if (`status` in refined) {
            const { status: wrappedKey } = refined
            handleStatus[wrappedKey](payload as any)
          } else {
            logger.error(`Unknown signal: ${refined.unknown}`)
          }
        })
      }
    )
