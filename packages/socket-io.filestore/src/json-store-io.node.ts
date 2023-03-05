import type { Socket, Server as WebSocketServer } from "socket.io"

import type { Encapsulate } from "~/packages/anvl/src/function"
import type { Json, JsonArr } from "~/packages/anvl/src/json"
import type { JsonStoreOptions } from "~/packages/socket-io.filestore/src"

import {
  initIndexer,
  initReader,
  initRelationReader,
  initSchemaReader,
} from "./read"
import type { ReadIndex, ReadRelations, ReadResource, ReadSchema } from "./read"
import { initRelationsWriter, initIndexWriter, initWriter } from "./write"
import type { WriteIndex, WriteRelations, WriteResource } from "./write"

/* prettier-ignore */
// server "on" / client "emit"
export type JsonStoreClientEvents = {
  read: Encapsulate<ReadResource>
  write: Encapsulate<WriteResource>
  indexRead: Encapsulate<ReadIndex> 
  indexWrite: Encapsulate<WriteIndex>
  relationsRead: Encapsulate<ReadRelations>
  relationsWrite: Encapsulate<WriteRelations>
  schemaRead: Encapsulate<ReadSchema>
}
/* prettier-ignore */
// server "emit" / client "on"
export type JsonStoreServerEvents =
  & Record<`indexRead_${string}`, (ids: JsonArr<string>) => void>
  & Record<`read_${string}`, (resource: Json) => void>
  & Record<`relationsRead_${string}`, (relations: Json) => void> 
  & Record<`schemaRead_${string}`, (schema: Json) => void>
  & { event: (message: string) => void }

export type JsonStoreClusterEvents = Record<keyof any, unknown>

type JsonStoreSocketServer = WebSocketServer<
  JsonStoreClientEvents,
  JsonStoreServerEvents,
  JsonStoreClusterEvents
>

export const serveJsonStore =
  (options: JsonStoreOptions) =>
  <YourServer extends WebSocketServer>(
    server: YourServer
  ): JsonStoreSocketServer & YourServer => {
    options.logger.info(`init`, `json-store-io`)
    server.on(
      `connection`,
      (
        socket: Socket<
          JsonStoreClientEvents,
          JsonStoreServerEvents,
          JsonStoreClusterEvents
        >
      ) => {
        const { logger } = options
        logger.info(socket.id, `connected`)
        socket.emit(`event`, `connected!`)

        const readResource = initReader(options)
        const readIndex = initIndexer(options)
        const readRelations = initRelationReader(options)
        const readSchema = initSchemaReader(options)
        const writeResource = initWriter(options)
        const writeIndex = initIndexWriter(options, readIndex)
        const writeRelations = initRelationsWriter(options)

        const handle: JsonStoreClientEvents = {
          read: ({ id, type }) => {
            logger.info(socket.id, `read`, id, type)
            const result = readResource({ id, type })
            return result instanceof Error
              ? logger.error(result)
              : socket.emit(`read_${id}`, result)
          },
          relationsRead: ({ id, type }) => {
            logger.info(socket.id, `relationsRead`, type, id)
            const result = readRelations({ id, type })
            return result instanceof Error
              ? console.error(result)
              : socket.emit(`relationsRead_${type}_${id}`, result)
          },
          indexRead: ({ type }) => {
            logger.info(socket.id, `indexRead`, type)
            const result = readIndex({ type })
            return result instanceof Error
              ? logger.error(result)
              : socket.emit(`indexRead_${type}`, result)
          },
          schemaRead: ({ type }) => {
            logger.info(socket.id, `schemaRead`, type)
            const result = readSchema({ type })
            return result instanceof Error
              ? logger.error(result)
              : socket.emit(`schemaRead_${type}`, result)
          },
          write: ({ id, type, value }) => {
            logger.info(socket.id, `write`, id, value)
            writeResource({ id, type, value })
          },
          relationsWrite: ({ id, type, value }) => {
            logger.info(`${socket.id} relationsWrite`, id, value)
            writeRelations({ id, type, value })
          },
          indexWrite: ({ type, value }) => {
            logger.info(socket.id, `indexWrite`, type)
            writeIndex({ type, value })
          },
        }
        socket.on(`read`, handle.read)
        socket.on(`write`, handle.write)
        socket.on(`indexRead`, handle.indexRead)
        socket.on(`indexWrite`, handle.indexWrite)
        socket.on(`relationsRead`, handle.relationsRead)
        socket.on(`relationsWrite`, handle.relationsWrite)
        socket.on(`schemaRead`, handle.schemaRead)
      }
    )
    return server as JsonStoreSocketServer & YourServer
  }
