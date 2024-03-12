import type { Server, Socket } from "socket.io"

import { recordToEntries } from "~/packages/anvl/src/object"
import {
	initIndexWriter,
	initIndexer,
	initRelationReader,
	initRelationsWriter,
	initResourceReader,
	initResourceTypeInitializer,
	initResourceWriter,
	initSchemaReader,
} from "~/packages/ingt/src"
import type { FilestoreOptions } from "~/packages/ingt/src"

import type {
	FilestoreClientEvents,
	FilestoreClusterEvents,
	FilestoreServerEvents,
} from "./interface"

export * from "./interface"

export type WebSocketServer<
	ClientEvents extends Record<string, any>,
	ServerEvents extends Record<string, any>,
	ServerSideEvents extends Record<string, any>,
> = Server<ClientEvents, ServerEvents, ServerSideEvents>

export type FilestoreSocketServer = WebSocketServer<
	FilestoreClientEvents,
	FilestoreServerEvents,
	FilestoreClusterEvents
>

export const serveFilestore =
	(options: FilestoreOptions) =>
	<YourServer extends WebSocketServer<any, any, any>>(
		server: YourServer,
	): FilestoreSocketServer & YourServer => (
		options.logger.info(`init`, `filestore server`),
		server.on(
			`connection`,
			(
				socket: Socket<
					FilestoreClientEvents,
					FilestoreServerEvents,
					FilestoreClusterEvents
				>,
			) => {
				const { logger } = options
				logger.info(socket.id, `connected`)
				socket.emit(`event`, `connected!`)

				const readResource = initResourceReader(options)
				const readIndex = initIndexer(options)
				const readRelations = initRelationReader(options)
				const readSchema = initSchemaReader(options)
				const writeResource = initResourceWriter(options)
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
						if (result instanceof Error) {
							console.error(result)
							return
						}
						socket.emit(`relationsRead_${type}_${id}`, result)
					},
					indexRead: ({ type }) => {
						logger.info(socket.id, `indexRead`, type)
						const result = readIndex({ type })
						if (result instanceof Error) {
							logger.error(result)
							return
						}
						socket.emit(`indexRead_${type}`, result)
					},
					schemaRead: ({ type }) => {
						logger.info(socket.id, `schemaRead`, type)
						const result = readSchema({ type })
						if (result instanceof Error) {
							logger.error(result)
							return
						}
						socket.emit(`schemaRead_${type}`, result)
					},
					write: async ({ id, type, value }) => {
						logger.info(socket.id, `write`, id, value)
						const result = await writeResource({ id, type, value })
						if (result instanceof Error) {
							logger.error(result)
							socket.emit(`error_filestore`, result.message)
						}
					},
					relationsWrite: ({ id, type, value }) => {
						logger.info(`${socket.id} relationsWrite`, id, value)
						writeRelations({ id, type, value })
					},
					indexWrite: ({ type, value }) => {
						logger.info(socket.id, `indexWrite`, type)
						writeIndex({ type, value })
					},
					initType: (type) => {
						logger.info(socket.id, `initType`, type)
						const result = initResourceType(type)
						if (result instanceof Error) {
							logger.error(result)
							socket.emit(`error_filestore`, result.message)
						} else {
							for (const [key, value] of recordToEntries(result)) {
								socket.emit(`scan_${key}`, value)
							}
						}
					},
				}
				socket.on(`read`, handle.read)
				socket.on(`write`, handle.write)
				socket.on(`indexRead`, handle.indexRead)
				socket.on(`indexWrite`, handle.indexWrite)
				socket.on(`relationsRead`, handle.relationsRead)
				socket.on(`relationsWrite`, handle.relationsWrite)
				socket.on(`schemaRead`, handle.schemaRead)
				socket.on(`initType`, handle.initType)
			},
		) as FilestoreSocketServer & YourServer
	)
