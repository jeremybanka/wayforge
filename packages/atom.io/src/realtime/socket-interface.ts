import type { Json } from "atom.io/json"

export type EventListener = (...args: Json.Serializable[]) => void

export type EventsMap = {
	[event: string]: EventListener
}

export type ParticularEventListener<ListenEvents extends EventsMap = EventsMap> =
	<E extends string & keyof ListenEvents>(
		event: E,
		listener: ListenEvents[E],
	) => void

export type AllEventsListener<ListenEvents extends EventsMap = EventsMap> = <
	E extends string & keyof ListenEvents,
>(
	event: E,
	...args: Parameters<ListenEvents[E]>
) => void

export type EventEmitter<EmitEvents extends EventsMap = EventsMap> = <
	E extends string & keyof EmitEvents,
>(
	event: E,
	...args: Parameters<EmitEvents[E]>
) => void

export interface GuardedSocket<ListenEvents extends EventsMap> extends Socket {
	id: string | undefined
	on: <E extends string & keyof ListenEvents>(
		event: E,
		listener: ListenEvents[E],
	) => void
	onAny: (
		listener: <E extends string & keyof ListenEvents>(
			event: E,
			...args: Parameters<ListenEvents[E]>
		) => void,
	) => void
	onAnyOutgoing: (listener: AllEventsListener<EventsMap>) => void
	off: <E extends string & keyof ListenEvents>(
		event: E,
		listener?: ListenEvents[E],
	) => void
	offAny: (
		listener?: <E extends string & keyof ListenEvents>(
			event: E,
			...args: Parameters<ListenEvents[E]>
		) => void,
	) => void
	emit: EventEmitter<EventsMap>
}

export type Socket = {
	id: string | undefined
	on: (event: string, listener: (...args: Json.Serializable[]) => void) => void
	onAny: (
		listener: (event: string, ...args: Json.Serializable[]) => void,
	) => void
	onAnyOutgoing: (
		listener: (event: string, ...args: Json.Serializable[]) => void,
	) => void
	off: (event: string, listener?: (...args: Json.Serializable[]) => void) => void
	offAny: (
		listener: (event: string, ...args: Json.Serializable[]) => void,
	) => void
	emit: (event: string, ...args: Json.Serializable[]) => void
}
