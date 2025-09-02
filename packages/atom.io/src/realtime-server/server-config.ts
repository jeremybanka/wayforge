import type { RootStore } from "atom.io/internal"

import type { Socket } from "./socket-interface"

export type ServerConfig = {
	socket: Socket
	store?: RootStore
}
