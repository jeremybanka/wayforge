import type { Store } from "atom.io/internal"
import type * as SocketIO from "socket.io"

export * from "./expose-single"
export * from "./expose-family"
export * from "./expose-mutable"
export * from "./expose-mutable-family"
export * from "./receive-transaction"
export * from "./receive-state"

export type ServerConfig = {
	socket: SocketIO.Socket
	store?: Store
}
