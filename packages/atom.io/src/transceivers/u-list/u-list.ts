import type { Lineage, Transceiver, TransceiverMode } from "atom.io/internal"
import { Subject } from "atom.io/internal"
import type { Json, primitive } from "atom.io/json"
import { stringifyJson } from "atom.io/json"

export type UListUpdateType = `add` | `clear` | `del` | `tx`
export type UListUpdate = `${UListUpdateType}:${string}`
// export type NumberedSetUpdate = `${number | `*`}=${UListUpdate}`

// export interface UListView<P extends primitive> extends ReadonlySet<P> {
// 	// readonly cache: ReadonlyArray<NumberedSetUpdate | null>
// 	// readonly cacheLimit: number
// 	// readonly cacheIdx: number
// 	// readonly cacheUpdateNumber: number
// }

export interface UListJson<P extends primitive> extends Json.Object {
	members: P[]
	// cache: (NumberedSetUpdate | null)[]
	// cacheLimit: number
	// cacheIdx: number
	// cacheUpdateNumber: number
}
export class UList<P extends primitive>
	extends Set<P>
	implements Transceiver<ReadonlySet<P>, UListUpdate, UListJson<P>>
{
	public mode: TransceiverMode = `record`
	public readonly subject: Subject<UListUpdate> = new Subject<UListUpdate>()
	// public cacheLimit = 0
	// public cache: (NumberedSetUpdate | null)[] = []
	// public cacheIdx = -1
	// public cacheUpdateNumber = -1

	public constructor(values?: Iterable<P>) {
		super(values)
		if (values instanceof UList) {
			// this.parent = values
			// this.cacheUpdateNumber = values.cacheUpdateNumber
		}
		// if (cacheLimit) {
		// this.cacheLi mit = cacheLimit
		// this.cache = new Array(cacheLimit)
		// this.subscribe(`auto cache`, (update) => {
		// 	this.cacheIdx++
		// 	this.cacheIdx %= this.cacheLimit
		// 	this.cache[this.cacheIdx] = update
		// })
		// }
	}

	public readonly READONLY_VIEW: ReadonlySet<P> = this

	public toJSON(): UListJson<P> {
		return {
			members: [...this],
			// cache: this.cache,
			// cacheLimit: this.cacheLimit,
			// cacheIdx: this.cacheIdx,
			// cacheUpdateNumber: this.cacheUpdateNumber,
		}
	}

	public static fromJSON<P extends primitive>(json: UListJson<P>): UList<P> {
		const set = new UList<P>(json.members) //, json.cacheLimit)
		// set.cache = json.cache
		// set.cacheIdx = json.cacheIdx
		// set.cacheUpdateNumber = json.cacheUpdateNumber
		return set
	}

	public add(value: P): this {
		const result = super.add(value)
		if (this.mode === `record`) {
			// this.cacheUpdateNumber++
			this.emit(`add:${stringifyJson<P>(value)}`)
		}
		return result
	}

	public clear(): void {
		const capturedContents = this.mode === `record` ? [...this] : null
		super.clear()
		if (capturedContents) {
			// this.cacheUpdateNumber++
			this.emit(`clear:${JSON.stringify(capturedContents)}`)
		}
	}

	public delete(value: P): boolean {
		const result = super.delete(value)
		if (this.mode === `record`) {
			// this.cacheUpdateNumber++
			this.emit(`del:${stringifyJson<P>(value)}`)
		}
		return result
	}

	// public readonly parent: UList<P> | null = null
	// public child: UList<P> | null = null
	// public transactionUpdates: UListUpdate[] | null = null
	// public transaction(run: (child: UList<P>) => boolean): void {
	// 	this.mode = `transaction`
	// 	this.transactionUpdates = []
	// 	this.child = new UList(this)
	// 	const unsubscribe = this.child._subscribe(`transaction`, (update) => {
	// 		this.transactionUpdates?.push(update)
	// 	})
	// 	try {
	// 		const shouldCommit = run(this.child)
	// 		if (shouldCommit) {
	// 			for (const update of this.transactionUpdates) {
	// 				this.doStep(update)
	// 			}
	// 			this.cacheUpdateNumber++
	// 			this.emit(`tx:${this.transactionUpdates.join(`;`)}`)
	// 		}
	// 	} catch (thrown) {
	// 		/* eslint-disable-next-line no-console */
	// 		console.warn(
	// 			`Did not apply transaction to SetRTX; this error was thrown:`,
	// 			thrown,
	// 		)
	// 		throw thrown
	// 	} finally {
	// 		unsubscribe()
	// 		this.child = null
	// 		this.transactionUpdates = null
	// 		this.mode = `record`
	// 	}
	// }

	protected _subscribe(
		key: string,
		fn: (update: UListUpdate) => void,
	): () => void {
		return this.subject.subscribe(key, fn)
	}
	public subscribe(
		key: string,
		// fn: (update: NumberedSetUpdate) => void,
		fn: (update: UListUpdate) => void,
	): () => void {
		return this.subject.subscribe(key, fn)
	}

	public emit(update: UListUpdate): void {
		this.subject.next(update)
	}

	private doStep(update: UListUpdate): void {
		const typeValueBreak = update.indexOf(`:`)
		const type = update.substring(0, typeValueBreak) as UListUpdateType
		const value = update.substring(typeValueBreak + 1)
		switch (type) {
			case `add`:
				this.add(JSON.parse(value))
				break
			case `clear`:
				this.clear()
				break
			case `del`:
				this.delete(JSON.parse(value))
				break
			case `tx`:
				for (const subUpdate of value.split(`;`)) {
					this.doStep(subUpdate as UListUpdate)
				}
		}
	}

	// public getUpdateNumber(update: NumberedSetUpdate): number {
	// 	const breakpoint = update.indexOf(`=`)
	// 	return Number(update.substring(0, breakpoint))
	// }

	// public do(update: NumberedSetUpdate): number | `OUT_OF_RANGE` | null {
	public do(update: UListUpdate): null {
		// const breakpoint = update.indexOf(`=`)
		// const updateNumber = Number(update.substring(0, breakpoint))
		// const eventOffset = updateNumber - this.cacheUpdateNumber
		// const isFuture = eventOffset > 0
		// if (isFuture || Number.isNaN(eventOffset)) {
		// 	if (eventOffset === 1 || Number.isNaN(eventOffset)) {
		this.mode = `playback`
		//		const innerUpdate = update.substring(breakpoint + 1) as UListUpdate
		this.doStep(update)
		this.mode = `record`
		// 		this.cacheUpdateNumber = updateNumber
		return null
		// 	}
		// 	return this.cacheUpdateNumber + 1
		// }
		// if (Math.abs(eventOffset) < this.cacheLimit) {
		// 	const eventIdx = this.cacheIdx + eventOffset
		// 	const cachedUpdate = this.cache[eventIdx]
		// 	if (cachedUpdate === update) {
		// 		return null
		// 	}
		// 	this.mode = `playback`
		// 	let done = false
		// 	while (!done) {
		// 		this.cacheIdx %= this.cacheLimit
		// 		const u = this.cache[this.cacheIdx]
		// 		this.cacheIdx--
		// 		if (!u) {
		// 			return `OUT_OF_RANGE`
		// 		}
		// 		this.undo(u)
		// 		done = this.cacheIdx === eventIdx - 1
		// 	}
		// 	const innerUpdate = update.substring(breakpoint + 1) as UListUpdate
		// 	this.doStep(innerUpdate)
		// 	this.mode = `record`
		// 	this.cacheUpdateNumber = updateNumber
		// 	return null
		// }
		// return `OUT_OF_RANGE`
	}

	public undoStep(update: UListUpdate): void {
		const breakpoint = update.indexOf(`:`)
		const type = update.substring(0, breakpoint) as UListUpdateType
		const value = update.substring(breakpoint + 1)
		switch (type) {
			case `add`:
				this.delete(JSON.parse(value))
				break
			case `del`:
				this.add(JSON.parse(value))
				break
			case `clear`: {
				const values = JSON.parse(value) as P[]
				for (const v of values) this.add(v)
				break
			}
			case `tx`: {
				const updates = value.split(`;`) as UListUpdate[]
				for (let i = updates.length - 1; i >= 0; i--) {
					this.undoStep(updates[i])
				}
			}
		}
	}

	public undo(update: UListUpdate): number | null {
		// const breakpoint = update.indexOf(`=`)
		// const updateNumber = Number(update.substring(0, breakpoint))
		// if (updateNumber === this.cacheUpdateNumber) {
		this.mode = `playback`
		// const innerUpdate = update.substring(breakpoint + 1) as UListUpdate
		this.undoStep(update)
		this.mode = `record`
		// this.cacheUpdateNumber--
		return null
		// }
		// return this.cacheUpdateNumber
	}
}
