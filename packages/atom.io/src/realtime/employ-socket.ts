import type { Json } from "atom.io/json"
import type { EventsMap, GuardedSocket, Socket } from "atom.io/realtime"

export function employSocket<I extends EventsMap, K extends string & keyof I>(
	socket: GuardedSocket<I>,
	event: K,
	handleEvent: (...data: Parameters<I[K]>) => void,
): () => void
export function employSocket(
	socket: Socket,
	event: string,
	handleEvent: (...data: Json.Serializable[]) => void,
): () => void
export function employSocket(
	socket: GuardedSocket<any> | Socket,
	event: string,
	handleEvent: (...data: Json.Serializable[]) => void,
): () => void {
	socket.on(event, handleEvent)
	return socket.off.bind(socket, event, handleEvent)
}
