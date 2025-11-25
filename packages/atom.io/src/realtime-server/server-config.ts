import type { RootStore } from "atom.io/internal"
import type { UntypedSocket } from "atom.io/realtime"

export type ServerConfig = {
	socket: UntypedSocket
	store?: RootStore
}
