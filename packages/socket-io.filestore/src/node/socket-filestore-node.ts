import type { Socket, Server as WebSocketServer } from "socket.io"

import {
  initIndexer,
  initReader,
  initRelationReader,
  initSchemaReader,
  initRelationsWriter,
  initIndexWriter,
  initWriter,
  initResourceTypeInitializer,
} from "./json-filestore"
import type { FilestoreOptions } from "./json-filestore/json-filestore"
import type {
  FilestoreClientEvents,
  FilestoreClusterEvents,
  FilestoreServerEvents,
} from "../interface"

export * from "../interface"
export * from "./json-filestore"

export type FilestoreSocketServer = WebSocketServer<
  FilestoreClientEvents,
  FilestoreServerEvents,
  FilestoreClusterEvents
>

export const serveFilestore =
  (options: FilestoreOptions) =>
  <YourServer extends WebSocketServer>(
    server: YourServer
  ): FilestoreSocketServer & YourServer => {
    options.logger.info(`init`, `filestore server`)
    server.on(
      `connection`,
      (
        socket: Socket<
          FilestoreClientEvents,
          FilestoreServerEvents,
          FilestoreClusterEvents
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
        const initResourceType = initResourceTypeInitializer(options)

        const handle: FilestoreClientEvents = {
          read: ({ id, type }) => {
            logger.info(socket.id, `read`, id, type)
            const result = readResource({ id, type })
            return result instanceof Error
              ? (logger.error(result),
                socket.emit(`error_filestore`, result.message))
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
          initType: ({ type }) => {
            logger.info(socket.id, `initType`, type)
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
    return server as FilestoreSocketServer & YourServer
  }
