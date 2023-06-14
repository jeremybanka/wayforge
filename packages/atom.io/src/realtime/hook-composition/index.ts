import type * as AtomIO from "atom.io"
import type * as SocketIO from "socket.io"

export * from "./expose-singleton"
export * from "./expose-family"

export type ServerConfig = {
  socket: SocketIO.Socket
  store?: AtomIO.__INTERNAL__.Store
}
