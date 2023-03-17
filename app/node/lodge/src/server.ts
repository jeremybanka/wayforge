import { Server as HttpServer } from "http"
import { Server as WebSocketServer } from "socket.io"
import express from "express"
import { CLIENT_PORT, SERVER_PORT_HTTP } from "./config"
import getGoogleAuthURL from "./auth"
// import Game from "./models/global/Game"

const app = express()

app.get(`/auth/google/url`, (_, res) => res.send(getGoogleAuthURL()))

export const server = new HttpServer(app)

export const io = new WebSocketServer(
  server,
  { cors: {
    origin: [`http://localhost:${CLIENT_PORT}`, `http://eris.local:3000`],
    methods: [`GET`, `POST`],
  } })

server.listen(SERVER_PORT_HTTP, () =>
  console.log(`Listening on port ${SERVER_PORT_HTTP}`)
)
