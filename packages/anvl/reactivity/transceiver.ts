import type { Json } from "../src/json"

export type Transceiver<Signal extends Json.Serializable> = {
	do: (update: Signal) => void
	undo: (update: Signal) => void
	subscribe: (key: string, fn: (update: Signal) => void) => () => void
}

export type TransceiverMode = `playback` | `record` | `transaction`
