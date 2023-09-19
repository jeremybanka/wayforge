import type { Json } from "../src/json"

export type Transceiver<Signal extends Json.Serializable> = {
	do: (update: Signal) => void
	undo: (update: Signal) => void
	subscribe: (key: string, fn: (update: Signal) => void) => () => void
}

export function isTransceiver(
	value: unknown,
): value is Transceiver<Json.Serializable> {
	return (
		typeof value === `object` &&
		value !== null &&
		`do` in value &&
		`undo` in value &&
		`subscribe` in value
	)
}

export type TransceiverMode = `playback` | `record` | `transaction`

export type Signal<Core extends Transceiver<any>> = Core extends Transceiver<
	infer Update
>
	? Update
	: never
