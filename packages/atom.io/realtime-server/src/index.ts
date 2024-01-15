import type { Store } from "atom.io/internal"
import type * as SocketIO from "socket.io"

export * from "./realtime-state-provider"
export * from "./realtime-state-synchronizer"
export * from "./realtime-family-provider"
export * from "./realtime-mutable-provider"
export * from "./realtime-mutable-family-provider"
export * from "./realtime-state-receiver"
export * from "./realtime-action-receiver"
export * from "./realtime-action-synchronizer"

export type ServerConfig = {
	socket: SocketIO.Socket
	store?: Store
}
