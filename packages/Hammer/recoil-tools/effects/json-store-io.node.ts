import { readdirSync, renameSync, writeFileSync } from "fs"
import { basename } from "path"

import type { Socket, Server as WebSocketServer } from "socket.io"
import type { EventsMap } from "socket.io/dist/typed-events"

import type { JsonStoreOptions } from "~/lib/node/json-store"
import type {
  ReadIndex,
  ReadRelations,
  ReadResource,
} from "~/lib/node/json-store/read"
import {
  initIndexer,
  initReader,
  initRelationReader,
} from "~/lib/node/json-store/read"
import type { WriteResource } from "~/lib/node/json-store/write"
import {
  initRelationsWriter,
  initIndexWriter,
  initWriter,
} from "~/lib/node/json-store/write"
import type { Json, JsonArr, JsonObj } from "~/packages/Anvil/src/json"

const pathToThisFile = basename(__filename)

type Encapsulate<T extends (...args: any[]) => any> = (
  ...args: Parameters<T>
) => void

/* prettier-ignore */
// server "on" / client "emit"
export type JsonStoreClientEvents =
  & {
    read: Encapsulate<ReadResource>
    write: Encapsulate<WriteResource>,
    indexRead: Encapsulate<ReadIndex>,
    indexWrite: (vars: { type: string; value: JsonArr<string> }) => void
    relationsRead: Encapsulate<ReadRelations>
    relationsWrite: (vars: { type: string; id: string; value: Json }) => void
  }
/* prettier-ignore */
// server "emit" / client "on"
export type JsonStoreServerEvents =
  & Record<`${string}_${string}`, (resource: JsonObj) => void>
  & Record<`indexRead_${string}`, (ids: JsonArr<string>) => void>
  & Record<`read_${string}`, (resource: Json) => void>
  & Record<`relationsRead_${string}`, (relations: Json) => void> 
  & {
      event: (message: string) => void
  }

export type JsonStoreServerSideEvents = Record<keyof any, unknown>

type JsonStoreSocketServer = WebSocketServer<
  JsonStoreClientEvents,
  JsonStoreServerEvents,
  JsonStoreServerSideEvents
>

export const serveJsonStore =
  (options: JsonStoreOptions) =>
  <YourServer extends WebSocketServer>(
    server: YourServer
  ): JsonStoreSocketServer & YourServer =>
    server.on(
      `connection`,
      (
        socket: Socket<
          JsonStoreClientEvents,
          JsonStoreServerEvents,
          JsonStoreServerSideEvents
        >
      ) => {
        const { logger } = options
        logger.info(socket.id, `connected`)
        socket.emit(`event`, `connected!`)

        const readResource = initReader(options)
        const readIndex = initIndexer(options)
        const readRelations = initRelationReader(options)
        const writeResource = initWriter(options)
        const writeIndex = initIndexWriter(options, readIndex)
        const writeRelations = initRelationsWriter(options)

        const onSocketRead: JsonStoreClientEvents[`read`] = ({ id, type }) => {
          logger.info(socket.id, `read`, id, type)
          const resource = readResource({ id, type })
          if (resource instanceof Error) {
            console.error(pathToThisFile, resource)
          } else {
            socket.emit(`read_${id}`, resource)
          }
        }

        const onSocketRelationsRead: JsonStoreClientEvents[`relationsRead`] = ({
          id,
          type,
        }) => {
          logger.info(socket.id, `relationsRead`, type, id)
          const relations = readRelations({ id, type })
          if (relations instanceof Error) {
            console.error(relations)
          } else {
            socket.emit(`relationsRead_${type}_${id}`, relations)
          }
        }

        const onSocketIndexRead: JsonStoreClientEvents[`indexRead`] = ({
          type,
        }) => {
          logger.info(socket.id, `indexRead`, type)
          const ids = readIndex({ type })
          if (ids instanceof Error) {
            console.error(ids)
          } else {
            socket.emit(`indexRead_${type}`, ids)
          }
        }

        const onSocketWrite: JsonStoreClientEvents[`write`] = ({
          id,
          type,
          value,
        }) => {
          logger.info(socket.id, `write`, id, value)
          writeResource({ id, type, value })
        }

        const onSocketRelationsWrite: JsonStoreClientEvents[`relationsWrite`] =
          ({ id, type, value }) => {
            logger.info(`${socket.id}  relationsWrite`, id, value)
            writeRelations({ id, type, value })
          }

        const onSocketIndexWrite: JsonStoreClientEvents[`indexWrite`] = ({
          type,
          value,
        }) => {
          logger.info(socket.id, `indexWrite`, type)
          writeIndex({ type, value })
        }

        socket.on(`read`, onSocketRead)
        socket.on(`write`, onSocketWrite)
        socket.on(`indexRead`, onSocketIndexRead)
        socket.on(`indexWrite`, onSocketIndexWrite)
        socket.on(`relationsRead`, onSocketRelationsRead)
        socket.on(`relationsWrite`, onSocketRelationsWrite)
      }
    )
