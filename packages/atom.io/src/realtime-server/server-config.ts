import type { RootStore } from "atom.io/internal"
import type { Socket, UserKey } from "atom.io/realtime"

export type ServerConfig = {
	socket: Socket
	userKey: UserKey
	store?: RootStore
}
