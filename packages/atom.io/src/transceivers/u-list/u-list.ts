import type {
	Enumeration,
	Fn,
	Transceiver,
	TransceiverMode,
} from "atom.io/internal"
import { enumeration, packValue, Subject, unpackValue } from "atom.io/internal"
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

export type PackedSetUpdate<P extends primitive> = string & {
	update?: SetUpdate<P>
}

export const SET_UPDATE_ENUM: Enumeration<[`add`, `delete`, `clear`]> =
	enumeration([`add`, `delete`, `clear`] as const)

export function packSetUpdate<P extends primitive>(
	update: SetUpdate<P>,
): PackedSetUpdate<P> {
	const head = SET_UPDATE_ENUM[update.type] + `\u001F`
	if (update.type === `clear`) {
		return head + update.values.map(packValue).join(`\u001E`)
	}
	return head + packValue(update.value)
}
export function unpackSetUpdate<P extends primitive>(
	packed: PackedSetUpdate<P>,
): SetUpdate<P> {
	const [type, tail] = packed.split(`\u001F`) as [0 | 1 | 2, string]
	const head = SET_UPDATE_ENUM[type]
	if (head === `clear`) {
		const values = tail.split(`\u001E`).map(unpackValue) as P[]
		return { type: `clear`, values }
	}
	return { type: head, value: unpackValue(tail) as P }
}

export type SetMutationHandler = { [K in UListUpdateType]: Fn }

export class UList<P extends primitive>
	extends Set<P>
	implements
		Transceiver<ReadonlySet<P>, PackedSetUpdate<P>, ReadonlyArray<P>>,
		SetMutationHandler
{
	public mode: TransceiverMode = `record`
	public readonly subject: Subject<PackedSetUpdate<P>> = new Subject()

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

	public subscribe(
		key: string,
		fn: (update: PackedSetUpdate<P>) => void,
	): () => void {
		return this.subject.subscribe(key, fn)
	}

	public emit(update: SetUpdate<P>): void {
		this.subject.next(packSetUpdate(update))
	}

	public do(packed: PackedSetUpdate<P>): null {
		this.mode = `playback`
		const update = unpackSetUpdate(packed)
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
		this.mode = `record`
		return null
	}

	public undo(packed: PackedSetUpdate<P>): number | null {
		const update = unpackSetUpdate(packed)
		this.mode = `playback`
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
		this.mode = `record`
		return null
	}
}
