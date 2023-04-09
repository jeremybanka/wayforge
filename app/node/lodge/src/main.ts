import dotenv from "dotenv"
import { pipe } from "fp-ts/function"
import { Server as WebSocketServer } from "socket.io"

dotenv.config()
pipe(
  new WebSocketServer(3333, {
    cors: {
      origin: `http://localhost:5173`,
      methods: [`GET`, `POST`],
    },
  }),
  (io) => {
    io.on(`connection`, (socket) => {
      console.log(`connected`)
      socket.on(`disconnect`, () => {
        console.log(`disconnected`)
      })
    })
  }
)
