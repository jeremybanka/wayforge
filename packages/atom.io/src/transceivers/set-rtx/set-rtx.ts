import type { Lineage, Transceiver, TransceiverMode } from "atom.io/internal"
import { Subject } from "atom.io/internal"
import type { Json, primitive } from "atom.io/json"
import { stringifyJson } from "atom.io/json"

export type SetUpdateType = `add` | `clear` | `del` | `tx`
export type SetUpdateString = `${SetUpdateType}:${string}`
export type NumberedSetUpdateString = `${number | `*`}=${SetUpdateString}`

export interface SetRTXView<P extends primitive> extends ReadonlySet<P> {
	readonly cache: ReadonlyArray<NumberedSetUpdateString | null>
	readonly cacheLimit: number
	readonly cacheIdx: number
	readonly cacheUpdateNumber: number
	readonly subscribe: (
		key: string,
		fn: (update: NumberedSetUpdateString) => void,
	) => () => void
}

export interface SetRTXJson<P extends primitive> extends Json.Object {
	members: P[]
	cache: (NumberedSetUpdateString | null)[]
	cacheLimit: number
	cacheIdx: number
	cacheUpdateNumber: number
}
export class SetRTX<P extends primitive>
	extends Set<P>
	implements
		Transceiver<SetRTXView<P>, NumberedSetUpdateString, SetRTXJson<P>>,
		Lineage
{
	public mode: TransceiverMode = `record`
	public readonly subject: Subject<SetUpdateString> =
		new Subject<SetUpdateString>()
	public cacheLimit = 0
	public cache: (NumberedSetUpdateString | null)[] = []
	public cacheIdx = -1
	public cacheUpdateNumber = -1

	public constructor(values?: Iterable<P>, cacheLimit = 0) {
		super(values)
		if (values instanceof SetRTX) {
			this.parent = values
			this.cacheUpdateNumber = values.cacheUpdateNumber
		}
		if (cacheLimit) {
			this.cacheLimit = cacheLimit
			this.cache = new Array(cacheLimit)
			this.subscribe(`auto cache`, (update) => {
				this.cacheIdx++
				this.cacheIdx %= this.cacheLimit
				this.cache[this.cacheIdx] = update
			})
		}
	}

	public readonly READONLY_VIEW: SetRTXView<P> = this

	public toJSON(): SetRTXJson<P> {
		return {
			members: [...this],
			cache: this.cache,
			cacheLimit: this.cacheLimit,
			cacheIdx: this.cacheIdx,
			cacheUpdateNumber: this.cacheUpdateNumber,
		}
	}

	public static fromJSON<P extends primitive>(json: SetRTXJson<P>): SetRTX<P> {
		const set = new SetRTX<P>(json.members, json.cacheLimit)
		set.cache = json.cache
		set.cacheIdx = json.cacheIdx
		set.cacheUpdateNumber = json.cacheUpdateNumber
		return set
	}

	public add(value: P): this {
		const result = super.add(value)
		if (this.mode === `record`) {
			this.cacheUpdateNumber++
			this.emit(`add:${stringifyJson<P>(value)}`)
		}
		return result
	}

	public clear(): void {
		const capturedContents = this.mode === `record` ? [...this] : null
		super.clear()
		if (capturedContents) {
			this.cacheUpdateNumber++
			this.emit(`clear:${JSON.stringify(capturedContents)}`)
		}
	}

	public delete(value: P): boolean {
		const result = super.delete(value)
		if (this.mode === `record`) {
			this.cacheUpdateNumber++
			this.emit(`del:${stringifyJson<P>(value)}`)
		}
		return result
	}

	public readonly parent: SetRTX<P> | null = null
	public child: SetRTX<P> | null = null
	public transactionUpdates: SetUpdateString[] | null = null
	public transaction(run: (child: SetRTX<P>) => boolean): void {
		this.mode = `transaction`
		this.transactionUpdates = []
		this.child = new SetRTX(this)
		const unsubscribe = this.child._subscribe(`transaction`, (update) => {
			this.transactionUpdates?.push(update)
		})
		try {
			const shouldCommit = run(this.child)
			if (shouldCommit) {
				for (const update of this.transactionUpdates) {
					this.doStep(update)
				}
				this.cacheUpdateNumber++
				this.emit(`tx:${this.transactionUpdates.join(`;`)}`)
			}
		} catch (thrown) {
			/* eslint-disable-next-line no-console */
			console.warn(
				`Did not apply transaction to SetRTX; this error was thrown:`,
				thrown,
			)
			throw thrown
		} finally {
			unsubscribe()
			this.child = null
			this.transactionUpdates = null
			this.mode = `record`
		}
	}

	protected _subscribe(
		key: string,
		fn: (update: SetUpdateString) => void,
	): () => void {
		return this.subject.subscribe(key, fn)
	}
	public subscribe(
		key: string,
		fn: (update: NumberedSetUpdateString) => void,
	): () => void {
		return this.subject.subscribe(key, (update) => {
			fn(`${this.cacheUpdateNumber}=${update}`)
		})
	}

	public emit(update: SetUpdateString): void {
		this.subject.next(update)
	}

	private doStep(update: SetUpdateString): void {
		const typeValueBreak = update.indexOf(`:`)
		const type = update.substring(0, typeValueBreak) as SetUpdateType
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
					this.doStep(subUpdate as SetUpdateString)
				}
		}
	}

	public getUpdateNumber(update: NumberedSetUpdateString): number {
		const breakpoint = update.indexOf(`=`)
		return Number(update.substring(0, breakpoint))
	}

	public do(update: NumberedSetUpdateString): number | `OUT_OF_RANGE` | null {
		const breakpoint = update.indexOf(`=`)
		const updateNumber = Number(update.substring(0, breakpoint))
		const eventOffset = updateNumber - this.cacheUpdateNumber
		const isFuture = eventOffset > 0
		if (isFuture || Number.isNaN(eventOffset)) {
			if (eventOffset === 1 || Number.isNaN(eventOffset)) {
				this.mode = `playback`
				const innerUpdate = update.substring(breakpoint + 1) as SetUpdateString
				this.doStep(innerUpdate)
				this.mode = `record`
				this.cacheUpdateNumber = updateNumber
				return null
			}
			return this.cacheUpdateNumber + 1
		}
		if (Math.abs(eventOffset) < this.cacheLimit) {
			const eventIdx = this.cacheIdx + eventOffset
			const cachedUpdate = this.cache[eventIdx]
			if (cachedUpdate === update) {
				return null
			}
			this.mode = `playback`
			let done = false
			while (!done) {
				this.cacheIdx %= this.cacheLimit
				const u = this.cache[this.cacheIdx]
				this.cacheIdx--
				if (!u) {
					return `OUT_OF_RANGE`
				}
				this.undo(u)
				done = this.cacheIdx === eventIdx - 1
			}
			const innerUpdate = update.substring(breakpoint + 1) as SetUpdateString
			this.doStep(innerUpdate)
			this.mode = `record`
			this.cacheUpdateNumber = updateNumber
			return null
		}
		return `OUT_OF_RANGE`
	}

	public undoStep(update: SetUpdateString): void {
		const breakpoint = update.indexOf(`:`)
		const type = update.substring(0, breakpoint) as SetUpdateType
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
				const updates = value.split(`;`) as SetUpdateString[]
				for (let i = updates.length - 1; i >= 0; i--) {
					this.undoStep(updates[i])
				}
			}
		}
	}

	public undo(update: NumberedSetUpdateString): number | null {
		const breakpoint = update.indexOf(`=`)
		const updateNumber = Number(update.substring(0, breakpoint))
		if (updateNumber === this.cacheUpdateNumber) {
			this.mode = `playback`
			const innerUpdate = update.substring(breakpoint + 1) as SetUpdateString
			this.undoStep(innerUpdate)
			this.mode = `record`
			this.cacheUpdateNumber--
			return null
		}
		return this.cacheUpdateNumber
	}
}
