import type { Store } from "atom.io/internal"
import type { Json } from "atom.io/json"

export * from "./ipc-sockets"
export * from "./realtime-continuity-synchronizer"
export * from "./realtime-server-stores"
export * from "./realtime-state-provider"
export * from "./realtime-state-synchronizer"
export * from "./realtime-family-provider"
export * from "./realtime-mutable-provider"
export * from "./realtime-mutable-family-provider"
export * from "./realtime-state-receiver"
export * from "./realtime-action-receiver"
// export * from "./realtime-action-synchronizer.txt"

export type Socket = {
	id: string
	on: (event: string, listener: (...args: Json.Serializable[]) => void) => void
	onAny: (
		listener: (event: string, ...args: Json.Serializable[]) => void,
	) => void
	off: (event: string, listener: (...args: Json.Serializable[]) => void) => void
	offAny: (
		listener: (event: string, ...args: Json.Serializable[]) => void,
	) => void
	emit: (event: string, ...args: Json.Serializable[]) => void
}
export type ServerConfig = {
	socket: Socket
	store?: Store
}
