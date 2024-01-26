import { findState, setState } from "atom.io"
import * as RTS from "atom.io/realtime-server"

import { gameContinuity, letterAtoms } from "./game-store"

process.stdout.write(`✨`)

const socket = new RTS.ParentSocket()

const letter0State = findState(letterAtoms, 0)

setState(letter0State, `A`)

socket.relay((userSocket) => {
	RTS.usersOfSockets.relations.set(userSocket.id, `relay:${userSocket.id}`)
	const continuitySynchronizer = RTS.realtimeContinuitySynchronizer({
		socket: userSocket,
	})
	continuitySynchronizer(gameContinuity)
})
