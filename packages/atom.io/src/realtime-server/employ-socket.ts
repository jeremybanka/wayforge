import type { Events } from "./ipc-sockets"
import type { Socket } from "./socket-interface"

export function employSocket<I extends Events, K extends string & keyof I>(
	socket: Socket,
	event: K,
	handleEvent: (...data: I[K]) => void,
): () => void {
	socket.on(event, handleEvent)
	const retireSocket = () => {
		socket.off(event, handleEvent)
	}
	return retireSocket
}
