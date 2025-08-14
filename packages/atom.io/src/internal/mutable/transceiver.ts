import type { Json } from "atom.io/json"

import type { SafelyExtract } from "../utility-types"

export interface Transceiver<
	V,
	S extends Json.Serializable,
	J extends Json.Serializable,
> {
	do: (update: S) => number | `OUT_OF_RANGE` | null
	undo: (update: S) => void
	subscribe: (key: string, fn: (update: S) => void) => () => void
	cacheUpdateNumber: number
	getUpdateNumber: (update: S) => number
	view: () => V
	toJSON: () => J
}

// biome-ignore format: intersection
export type TransceiverConstructor<
  J extends Json.Serializable,
  T extends Transceiver<any, any, J>
> =
	& ( new () => T )
	& { fromJSON: (json: J) => T }

export function isTransceiver(
	value: unknown,
): value is Transceiver<any, Json.Serializable, Json.Serializable> {
	return (
		typeof value === `object` &&
		value !== null &&
		`do` in value &&
		`undo` in value &&
		`subscribe` in value
	)
}

export type AsTransceiver<T> = T extends Transceiver<any, any, any>
	? T
	: Transceiver<any, any, any> extends T
		? SafelyExtract<T, Transceiver<any, any, any>>
		: T & Transceiver<any, any, any>

export type TransceiverMode = `playback` | `record` | `transaction`

export type ViewOf<T> = T extends Transceiver<infer V, any, any> ? V : T

export type SignalFrom<T extends Transceiver<any, any, any>> =
	T extends Transceiver<any, infer S, any> ? S : never

export type AsJSON<T extends Transceiver<any, any, any>> = T extends Transceiver<
	any,
	any,
	infer J
>
	? J
	: never

export type ConstructorOf<T extends Transceiver<any, any, any>> =
	TransceiverConstructor<AsJSON<T>, T>

/*
A transceiver may also keep a list of updates that have been applied to it.
This is useful for undo/redo functionality, especially in the context of
revising history. It is a good idea to accept a cache limit in your
constructor, and overwrite old updates. Here's an example of how we
might set that up:

myTransceiver = Transceiver {
	cacheUpdateNumber: number = 27
	cacheIdx: number = 1
	cacheLimit: number = 3
	cache: Array<Update> = [
		26=add:"x"
		27=del:"x" (current)
		25=add:"y"
	]
}

CONFIRM/NO-OP
Update `27=del:"x"` is passed to myTransceiver.do:
- [updateNumber = 27, update = `del:"x"`]
- updateOffset = updateNumber - cacheUpdateNumber // 0
- eventOffset < 1 // true (we're validating the past)
- |eventOffset| < cacheLimit // true (we remember this update)
- eventIdx = cacheIdx + updateOffset // 1
- update === cache.get(eventIdx) // true
- return null // 👍

EXPECTED UPDATE
Update `28=add:"x"` is passed to myTransceiver.do:
- [updateNumber = 28, update = `add:"x"`]
- updateOffset = updateNumber - cacheUpdateNumber // 1
- eventOffset < 1 // false (we're in the future)
- eventOffset === 1 // true (we're ready to apply this update)
- cacheIdx += eventOffset // 2
- cacheIdx %= cacheLimit // 2
- cache[cacheIdx] = update // cache = <{ 0 => add:"x" }>
- return null  // 👍

UNEXPECTED UPDATE
Update `29=del:"x"` is passed to myTransceiver.do:
- [updateNumber = 29, update = `del:"x"`]
- updateOffset = updateNumber - cacheUpdateNumber // 2
- eventOffset < 1 // false (we're in the future)
- eventOffset === 1 // false (we're NOT ready to apply this update)
- updateIdx := cacheIdx + updateOffset // 3
- updateIdx %= cacheLimit // 0
- cache[updateIdx] = update // cache = <{ 0 => del:"x" }>
- expectedUpdateNumber = cacheUpdateNumber + 1 // 28
- return expectedUpdateNumber // 🤨👂

SUCCESSFUL ROLLBACK UPDATE
Update `25=add:"z"` is passed to myTransceiver.do:
- [updateNumber = 25, update = `add:"z"`]
- updateOffset = updateNumber - cacheUpdateNumber // -2
- eventOffset < 1 // true (we're validating the past)
- |eventOffset| < cacheLimit // true (we remember this update)
- eventIdx = cacheIdx + updateOffset // -1
- eventIdx %= cacheLimit // 2
- update === cache[eventIdx] // false (we're rolling back)
- done := false
- update := cache[cacheIdx] // update = `del:"x"`
- undo(update) // myTransceiver.undo(`del:"x"`)
- while (!done) {
- 	cacheIdx -= 1 // 0, -1
- 	cacheIdx %= cacheLimit // 0, 2
- 	update = cache[cacheIdx] // update = `add:"y"`, `add:"x"`
- 	undo(update) // myTransceiver.undo(`add:"y"`), myTransceiver.undo(`add:"x"`)
- 	done = cacheIdx === eventIdx // false, true
- }
- do(update) // myTransceiver.do(`add:"z"`)
- return null // 👍

UNSUCCESSFUL ROLLBACK UPDATE
Update `24=add:"z"` is passed to myTransceiver.do:
- [updateNumber = 24, update = `add:"z"`]
- updateOffset = updateNumber - cacheUpdateNumber // -3
- eventOffset < 1 // true (we're validating the past)
- |eventOffset| < cacheLimit // 3 < 3 // false (we don't remember this update)
- return `OUT_OF_RANGE` // 😵‍💫👂

*/

// The function wants a constructor C
// - that has a static fromJSON(json) returning an instance of C
// - and whose instances have toJSON() whose return type matches fromJSON's param
