import type { RootStore } from "atom.io/internal"
import type { Json } from "atom.io/json"

export * from "./continuity/prepare-to-sync-realtime-continuity"
export * from "./ipc-sockets"
export * from "./realtime-action-receiver"
export * from "./realtime-family-provider"
export * from "./realtime-mutable-family-provider"
export * from "./realtime-mutable-provider"
export * from "./realtime-server-stores"
export * from "./realtime-state-provider"
export * from "./realtime-state-receiver"

export type Socket = {
	id: string | undefined
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
	store?: RootStore
}
