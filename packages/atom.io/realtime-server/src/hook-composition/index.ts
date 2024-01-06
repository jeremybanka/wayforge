import type { Store } from "atom.io/internal"
import type * as SocketIO from "socket.io"

export * from "./expose-single"
export * from "./expose-family"
export * from "./expose-mutable"
export * from "./expose-mutable-family"
export * from "./receive-state"
export * from "./receive-transaction"
export * from "./sync-transaction"

export type ServerConfig = {
	socket: SocketIO.Socket
	store?: Store
}
