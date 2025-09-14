import type { RootStore } from "atom.io/internal"
import type { Socket } from "atom.io/realtime"

export type ServerConfig = {
	socket: Socket
	store?: RootStore
}
