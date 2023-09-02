import type * as AtomIO from "atom.io"
import type * as SocketIO from "socket.io"

export * from "./expose-single"
export * from "./expose-family"
export * from "./expose-mutable"
export * from "./expose-mutable-family"
export * from "./receive-transaction"
export * from "./receive-state"

export type ServerConfig = {
	socket: SocketIO.Socket
	store?: AtomIO.__INTERNAL__.Store
}
