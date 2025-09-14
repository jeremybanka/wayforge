import type { Json } from "atom.io/json"

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
