import type { Transceiver, TransceiverMode } from "atom.io/internal"
import { Subject } from "atom.io/internal"
import type { Json, primitive, stringified } from "atom.io/json"
import { stringifyJson } from "atom.io/json"

export type UListUpdateType = `add` | `clear` | `del`
export type UListUpdate<P extends primitive> =
	| `${`add` | `del`}:${stringified<P>}`
	| `clear:${stringified<P[]>}`

export interface UListJson<P extends primitive> extends Json.Object {
	members: P[]
}
export class UList<P extends primitive>
	extends Set<P>
	implements Transceiver<ReadonlySet<P>, UListUpdate<P>, UListJson<P>>
{
	public mode: TransceiverMode = `record`
	public readonly subject: Subject<UListUpdate<P>> = new Subject<
		UListUpdate<P>
	>()

	public constructor(values?: Iterable<P>) {
		super(values)
		if (values instanceof UList) {
		}
	}

	public readonly READONLY_VIEW: ReadonlySet<P> = this

	public toJSON(): UListJson<P> {
		return {
			members: [...this],
		}
	}

	public static fromJSON<P extends primitive>(json: UListJson<P>): UList<P> {
		return new UList<P>(json.members)
	}

	public add(value: P): this {
		const result = super.add(value)
		if (this.mode === `record`) {
			this.emit(`add:${stringifyJson<P>(value)}`)
		}
		return result
	}

	public clear(): void {
		const capturedContents = this.mode === `record` ? [...this] : null
		super.clear()
		if (capturedContents) {
			this.emit(`clear:${stringifyJson(capturedContents)}`)
		}
	}

	public delete(value: P): boolean {
		const result = super.delete(value)
		if (this.mode === `record`) {
			this.emit(`del:${stringifyJson<P>(value)}`)
		}
		return result
	}

	public subscribe(
		key: string,
		fn: (update: UListUpdate<P>) => void,
	): () => void {
		return this.subject.subscribe(key, fn)
	}

	public emit(update: UListUpdate<P>): void {
		this.subject.next(update)
	}

	private doStep(update: UListUpdate<P>): void {
		const typeValueBreak = update.indexOf(`:`)
		const type = update.substring(0, typeValueBreak) as UListUpdateType
		const value = update.substring(typeValueBreak + 1)
		switch (type) {
			case `add`:
				this.add(JSON.parse(value))
				break
			case `del`:
				this.delete(JSON.parse(value))
				break
			case `clear`:
				this.clear()
		}
	}

	public do(update: UListUpdate<P>): null {
		this.mode = `playback`
		this.doStep(update)
		this.mode = `record`
		return null
	}

	public undoStep(update: UListUpdate<P>): void {
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
			}
		}
	}

	public undo(update: UListUpdate<P>): number | null {
		this.mode = `playback`
		this.undoStep(update)
		this.mode = `record`
		return null
	}
}
