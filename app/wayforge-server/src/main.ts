import { Server as HttpServer } from "http"

import compression from "compression"
import cors from "cors"
import express from "express"
import morgan from "morgan"
import type { Socket } from "socket.io"
import { Server as WebSocketServer } from "socket.io"

const app = express()
app.use(cors())
app.use(compression())
app.use(morgan(`tiny`))

export const server = new HttpServer(app)

export const io = new WebSocketServer(3333, {
  cors: {
    origin: `http://localhost:4200`,
    methods: [`GET`, `POST`],
  },
})

console.log(`Listening on port 3333`)

io.on(`connection`, (socket: Socket) => {
  console.log(socket.id, `connected`)
  socket.emit(`event`, `connected!`)
  socket.on(`something`, (data) => {
    console.log(socket.id, data)
    socket.emit(`event`, `pong`)
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
