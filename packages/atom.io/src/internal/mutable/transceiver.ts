import type { Json } from "atom.io/json"

export interface Transceiver<
	S extends Json.Serializable,
	J extends Json.Serializable,
> {
	do: (update: S) => number | `OUT_OF_RANGE` | null
	undo: (update: S) => void
	subscribe: (key: string, fn: (update: S) => void) => () => void
	cacheUpdateNumber: number
	getUpdateNumber: (update: S) => number
	toJSON: () => J
}

export type TransceiverKit<
	J extends Json.Serializable,
	C extends abstract new (
		...args: any[]
	) => Transceiver<any, J>,
> = C & { fromJSON: (json: J) => InstanceType<C> }

export function isTransceiver(
	value: unknown,
): value is Transceiver<Json.Serializable, Json.Serializable> {
	return (
		typeof value === `object` &&
		value !== null &&
		`do` in value &&
		`undo` in value &&
		`subscribe` in value
	)
}

export type TransceiverMode = `playback` | `record` | `transaction`

export type Signal<TVR extends Transceiver<any, any>> = TVR extends Transceiver<
	infer S,
	any
>
	? S
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

// The function wants a constructor C
// - that has a static fromJSON(json) returning an instance of C
// - and whose instances have toJSON() whose return type matches fromJSON's param
function takeClass<
	J extends Json.Serializable,
	C extends abstract new (
		...args: any[]
	) => {
		toJSON(): J
	},
>(
	Ctor: C & {
		fromJSON(json: J): InstanceType<C>
	},
) {
	// ...use Ctor here
}

class User {
	public name: string
	public constructor(name: string) {
		this.name = name
	}
	public toJSON() {
		return { name: this.name }
	}
	public static fromJSON(j: { name: string }) {
		return new User(j.name)
	}
}

takeClass(User) // ✅ OK

class Bad {
	public toJSON() {
		return { x: 1 }
	}
	public static fromJSON(_j: string) {
		return new Bad()
	} // ❌ param type doesn't match toJSON
}

// // @ts-expect-error
// takeClass(Bad)

function z(a: abstract new () => any) {
	takeClass(a)
}
z(
	class {
		public constructor(b?: string) {
			console
		}
	},
)
