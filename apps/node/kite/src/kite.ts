import dotenv from "dotenv"
import { pipe } from "fp-ts/function"
import { Server as WebSocketServer } from "socket.io"

import {
	useExposeMutable,
	useExposeMutableFamily,
	useReceiveTransaction,
	useSyncTransaction,
} from "~/packages/atom.io/realtime/src"
import { logger } from "./kite-logger"
import { addNumberCollectionTX, numberCollectionIndex } from "./kite-store"

logger.info(`🚀`, `server starting`)

const TIMESTAMP = Date.now()

dotenv.config()
pipe(
	new WebSocketServer(6363, {
		cors: {
			origin: `http://localhost:5173`,
			methods: [`GET`, `POST`],
		},
	}),
	(io) => {
		io.on(`connection`, (socket) => {
			// WELCOME
			logger.info(socket.id, `connected`)
			io.emit(`connection`, TIMESTAMP)

			// LOGGING
			socket.onAny((event, ...args) => {
				logger.info(`${socket.id}`, event, ...args)
			})
			socket.onAnyOutgoing((event, ...args) => {
				if (JSON.stringify(args).length > 1000) {
					const summary = {
						string: `${JSON.stringify(args).slice(0, 10)}...`,
					}[typeof args[0]]
					logger.info(`${socket.id} <<`, event, summary, `...`)
					return
				}
				logger.info(`${socket.id} <<`, event, ...args)
			})

			// REALTIME
			const exposeMutable = useExposeMutable({ socket })
			exposeMutable(numberCollectionIndex)

			const sync = useSyncTransaction({ socket })
			sync(addNumberCollectionTX)
			// const exposeMutableFamily = useExposeMutableFamily(socket)
		})
	},
)
