import type { Json } from "../src/json"

export type TransmitterReceiver<Signal extends Json> = {
	do: (update: Signal) => void
	undo: (update: Signal) => void
	observe: (fn: (update: Signal) => void) => () => void
}
