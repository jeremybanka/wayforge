import fs from "fs"
import { Server as HttpServer } from "http"

import compression from "compression"
import cors from "cors"
import express from "express"
import morgan from "morgan"
import type { Socket } from "socket.io"
import { Server as WebSocketServer } from "socket.io"
import type { EventsMap } from "socket.io/dist/typed-events"

import energySchema from "~/gen/energy.schema"
import { getDirectoryJsonEntries } from "~/lib/fs"
import { SaveJsonWebsocketServer } from "~/lib/recoil-tools/effects/socket-io.server"

import { formatJson } from "./services/formatJson"

const { log } = console

const app = express()
app.use(cors())
app.use(compression())
app.use(morgan(`tiny`))

export const server = new HttpServer(app)

console.log(`Listening on port 3333`)

// io.use(saveJson)

SaveJsonWebsocketServer(
  3333,
  {
    cors: {
      origin: `http://localhost:5173`,
      methods: [`GET`, `POST`],
    },
  },
  {
    formatter: formatJson,
    nameFile: (type, value) => `${type}/${value.name}_${value.id}`,
    jsonRoot: `./projects/wayfarer`,
  }
)

// http://expressjs.com/en/advanced/best-practice-security.html#at-a-minimum-disable-x-powered-by-header
app.disable(`x-powered-by`)

const port = process.env.port || 3333
// const server = app.listen(port, () => {
//   console.log(`Listening at http://localhost:${port}/api`)
// })
server.on(`error`, console.error)
