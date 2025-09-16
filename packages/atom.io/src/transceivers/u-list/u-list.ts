import type { Fn, Transceiver, TransceiverMode } from "atom.io/internal"
import { Subject } from "atom.io/internal"
import type { primitive } from "atom.io/json"

type Enumeration<T extends string> = Record<T, number> & Record<number, T>
function enumeration<T extends string>(...values: T[]): Enumeration<T> {
	const result: Record<any, any> = {}
	let i = 0
	for (const value of values) {
		result[value] = i
		result[i] = value
		++i
	}
	return result
}

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

const BOOL = "\u0001"
const NULL = "\u0002"
const STRING = "\u0003"
const NUMBER = "\u0004"

export const SET_UPDATE_ENUM: Enumeration<UListUpdateType> = enumeration(
	`add`,
	`delete`,
	`clear`,
)

export function packSetUpdate<P extends primitive>(
	update: SetUpdate<P>,
): PackedSetUpdate<P> {
	const head = SET_UPDATE_ENUM[update.type] + `\u001F`
	if (update.type === `clear`) {
		return (
			head +
			update.values
				.map((value) => {
					switch (typeof value) {
						case `string`:
							return STRING + value
						case `number`:
							return NUMBER + value
						case `boolean`:
							return BOOL + +value
						case `object`:
							return NULL
					}
				})
				.join(`\u001E`)
		)
	}
	switch (typeof update.value) {
		case `string`:
			return head + STRING + update.value
		case `number`:
			return head + NUMBER + update.value
		case `boolean`:
			return head + BOOL + +update.value
		case `object`:
			return head + NULL
	}
}
export function unpackSetUpdate<P extends primitive>(
	packed: PackedSetUpdate<P>,
): SetUpdate<P> {
	const [type, tail] = packed.split(`\u001F`) as [number, string]
	const head = SET_UPDATE_ENUM[type]
	if (head === `clear`) {
		const values = tail.split(`\u001E`).map((value) => {
			switch (value[0]) {
				case STRING:
					return value.slice(1)
				case NUMBER:
					return +value.slice(1)
				case BOOL:
					return value.slice(1) === `1`
				case NULL:
					return null
			}
		}) as P[]
		return { type: `clear`, values }
	}
	switch (head) {
		case `add`:
		case `delete`:
			switch (tail[0] as `\u0001` | `\u0002` | `\u0003` | `\u0004`) {
				case STRING:
					return { type: head, value: tail.slice(1) as P }
				case NUMBER:
					return { type: head, value: +tail.slice(1) as P }
				case BOOL:
					return { type: head, value: (tail.slice(1) === `1`) as P }
				case NULL:
					return { type: head, value: null as P }
			}
	}
}

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
