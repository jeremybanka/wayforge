import type { Json } from "atom.io/json"

export interface Transceiver<Signal extends Json.Serializable> {
	do: (update: Signal) => number | `OUT_OF_RANGE` | null
	undo: (update: Signal) => void
	subscribe: (key: string, fn: (update: Signal) => void) => () => void
	cacheUpdateNumber: number
	getUpdateNumber: (update: Signal) => number
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

export type Signal<TVR extends Transceiver<any>> = TVR extends Transceiver<
	infer Signal
>
	? Signal
	: never

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
