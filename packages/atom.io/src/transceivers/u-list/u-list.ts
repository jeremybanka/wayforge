import type { Fn, Transceiver, TransceiverMode } from "atom.io/internal"
import { Subject } from "atom.io/internal"
import type { primitive } from "atom.io/json"

export type SetMutations = Exclude<
	keyof Set<any>,
	symbol | keyof ReadonlySet<any>
>
export type SetUpdate<P extends primitive> =
	| {
			type: `add` | `delete`
			value: P
	  }
	| {
			type: `clear`
			values: P[]
	  }
export type UListUpdateType = SetUpdate<any>[`type`]
true satisfies SetMutations extends UListUpdateType
	? true
	: Exclude<SetMutations, UListUpdateType>

export type SetMutationHandler = { [K in UListUpdateType]: Fn }

export class UList<P extends primitive>
	extends Set<P>
	implements
		Transceiver<ReadonlySet<P>, SetUpdate<P>, ReadonlyArray<P>>,
		SetMutationHandler
{
	public mode: TransceiverMode = `record`
	public readonly subject: Subject<SetUpdate<P>> = new Subject<SetUpdate<P>>()

	public constructor(values?: Iterable<P>) {
		super(values)
		if (values instanceof UList) {
		}
	}

	public readonly READONLY_VIEW: ReadonlySet<P> = this

	public toJSON(): ReadonlyArray<P> {
		return [...this]
	}

	public static fromJSON<P extends primitive>(json: ReadonlyArray<P>): UList<P> {
		return new UList<P>(json)
	}

	public add(value: P): this {
		const result = super.add(value)
		if (this.mode === `record`) {
			this.emit({ type: `add`, value })
		}
		return result
	}

	public clear(): void {
		const capturedContents = this.mode === `record` ? [...this] : null
		super.clear()
		if (capturedContents) {
			this.emit({ type: `clear`, values: capturedContents })
		}
	}

	public delete(value: P): boolean {
		const result = super.delete(value)
		if (this.mode === `record`) {
			this.emit({ type: `delete`, value })
		}
		return result
	}

	public subscribe(key: string, fn: (update: SetUpdate<P>) => void): () => void {
		return this.subject.subscribe(key, fn)
	}

	public emit(update: SetUpdate<P>): void {
		this.subject.next(update)
	}

	private doStep(update: SetUpdate<P>): void {
		switch (update.type) {
			case `add`:
				this.add(update.value)
				break
			case `delete`:
				this.delete(update.value)
				break
			case `clear`:
				this.clear()
		}
	}

	public do(update: SetUpdate<P>): null {
		this.mode = `playback`
		this.doStep(update)
		this.mode = `record`
		return null
	}

	public undoStep(update: SetUpdate<P>): void {
		switch (update.type) {
			case `add`:
				this.delete(update.value)
				break
			case `delete`:
				this.add(update.value)
				break
			case `clear`: {
				const values = update.values
				for (const v of values) this.add(v)
			}
		}
	}

	public undo(update: SetUpdate<P>): number | null {
		this.mode = `playback`
		this.undoStep(update)
		this.mode = `record`
		return null
	}
}
