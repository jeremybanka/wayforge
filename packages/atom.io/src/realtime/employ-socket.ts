import type { EventsMap, Socket, TypedSocket } from "atom.io/realtime"
import type { Events } from "atom.io/realtime-server"

export function employSocket<I extends EventsMap, K extends string & keyof I>(
	socket: TypedSocket<I, any>,
	event: K,
	handleEvent: (...data: Parameters<I[K]>) => void,
): () => void
export function employSocket<I extends Events, K extends string & keyof I>(
	socket: Socket,
	event: K,
	handleEvent: (...data: I[K]) => void,
): () => void
export function employSocket<I extends Events, K extends string & keyof I>(
	socket: Socket | TypedSocket<any, any>,
	event: K,
	handleEvent: (...data: I[K]) => void,
): () => void {
	socket.on(event, handleEvent)
	const retireSocket = () => {
		socket.off(event, handleEvent)
	}
	return retireSocket
}
