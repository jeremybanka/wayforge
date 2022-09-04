import fs from "fs"
import { Server as HttpServer } from "http"

import compression from "compression"
import cors from "cors"
import express from "express"
import morgan from "morgan"
import type { Socket } from "socket.io"
import { Server as WebSocketServer } from "socket.io"

import energySchema from "~/gen/energy.schema"
import { getDirectoryJsonEntries } from "~/lib/fs"

import { formatJson } from "./services/formatJson"

const app = express()
app.use(cors())
app.use(compression())
app.use(morgan(`tiny`))

export const server = new HttpServer(app)

export const io = new WebSocketServer(3333, {
  cors: {
    origin: `http://localhost:5173`,
    methods: [`GET`, `POST`],
  },
})

console.log(`Listening on port 3333`)

const getFileById = ({ id, type }) => {
  const fileNames = fs.readdirSync(`./data/${type}`)
}

io.on(`connection`, (socket: Socket) => {
  console.log(socket.id, `connected`)
  socket.emit(`event`, `connected!`)
  socket.on(`write`, ({ id, type, value }) => {
    console.log(socket.id, `write`, id, value)
    const valueAsString = JSON.stringify(value)
    const formatted = formatJson(valueAsString)
    fs.writeFileSync(`./projects/wayfarer/${type}/${value.name}.json`, formatted)
  })
  socket.on(`read`, ({ id, type }) => {
    console.log(socket.id, `read`, id, type)
    const dir = `./projects/wayfarer/${type}`
    const entries = getDirectoryJsonEntries({
      dir,
      refine: (json) => energySchema.parse(json),
      enableWarnings: true,
    })
    const [, fileContents] = entries.find(([, data]) => data.id === id)
    socket.emit(`${type}:${id}`, fileContents)
  })
  socket.on(`index`, ({ type }) => {
    console.log(socket.id, `index`, type)
    const dir = `./projects/wayfarer/${type}`
    const entries = getDirectoryJsonEntries({
      dir,
      refine: (json) => energySchema.parse(json),
      enableWarnings: true,
    })
    const fileContents = entries.map(([, data]) => data.id)
    socket.emit(`${type}:index`, fileContents)
  })
})

// http://expressjs.com/en/advanced/best-practice-security.html#at-a-minimum-disable-x-powered-by-header
app.disable(`x-powered-by`)

app.get(`/api`, (req, res) => {
  res.send({ message: `Welcome to nx-express!` })
})

const port = process.env.port || 3333
// const server = app.listen(port, () => {
//   console.log(`Listening at http://localhost:${port}/api`)
// })
server.on(`error`, console.error)
