import type { Fn, Transceiver, TransceiverMode } from "atom.io/internal"
import { Subject } from "atom.io/internal"
import type { Enumeration, packed, primitive } from "atom.io/json"
import { enumeration, packCanonical, unpackCanonical } from "atom.io/json"

export type ArrayMutations = Exclude<keyof Array<any>, keyof ReadonlyArray<any>>
export type ArrayUpdate<P extends primitive> =
	| {
			type: `copyWithin`
			target: number
			start: number
			end?: number
			prev: readonly P[]
	  }
	| {
			type: `extend`
			next: number
			prev: number
	  }
	| {
			type: `fill`
			value: P
			start?: number
			end?: number
			prev: readonly P[]
	  }
	| {
			type: `pop` | `shift`
			value?: P
	  }
	| {
			type: `push` | `unshift`
			items: readonly P[]
	  }
	| {
			type: `reverse`
	  }
	| {
			type: `set`
			next: P
			prev?: P
			index: number
	  }
	| {
			type: `sort`
			next: readonly P[]
			prev: readonly P[]
	  }
	| {
			type: `splice`
			start: number
			deleteCount: number
			items: readonly P[]
			deleted: readonly P[]
	  }
	| {
			type: `truncate`
			length: number
			items: readonly P[]
	  }
export type OListUpdateType = ArrayUpdate<any>[`type`]
true satisfies ArrayMutations extends OListUpdateType
	? true
	: Exclude<ArrayMutations, OListUpdateType>

export type PackedArrayUpdate<P extends primitive> = string & {
	update?: ArrayUpdate<P>
	type?: P
}

const ARRAY_UPDATES = [
	// virtual methods
	`set`,
	`truncate`,
	`extend`,
	// actual methods
	`pop`,
	`push`,
	`shift`,
	`unshift`,
	`copyWithin`,
	`fill`,
	`splice`,
	`reverse`,
	`sort`,
] as const
true satisfies ArrayUpdate<any>[`type`] extends (typeof ARRAY_UPDATES)[number]
	? true
	: Exclude<ArrayUpdate<any>[`type`], (typeof ARRAY_UPDATES)[number]>

export const ARRAY_UPDATE_ENUM: Enumeration<typeof ARRAY_UPDATES> =
	enumeration(ARRAY_UPDATES)

export type ArrayMutationHandler = {
	[K in Exclude<OListUpdateType, `extend` | `set` | `truncate`>]: Fn
}

export type OListView<P extends primitive> = ReadonlyArray<P> & {
	subscribe: (
		key: string,
		fn: (update: PackedArrayUpdate<P>) => void,
	) => () => void
}

export class OList<P extends primitive>
	extends Array<P>
	implements
		Transceiver<OListView<P>, PackedArrayUpdate<P>, ReadonlyArray<P>>,
		ArrayMutationHandler
{
	public mode: TransceiverMode = `record`
	public readonly subject: Subject<PackedArrayUpdate<P>> = new Subject()

	public readonly READONLY_VIEW: OListView<P> = this

	public constructor(arrayLength?: number)
	public constructor(...items: P[])
	public constructor(...items: P[]) {
		super(...items)
		// biome-ignore lint/correctness/noConstructorReturn: this is chill
		return new Proxy(this, {
			set: (target, prop, value, receiver) => {
				if (
					typeof prop === `string` &&
					!Number.isNaN(Number.parseInt(prop, 10))
				) {
					const index = Number(prop)
					let prev: P | undefined
					if (this.mode === `record`) {
						prev = target[index]
					}
					target[index] = value
					if (prev) {
						this.emit({ type: `set`, index, next: value, prev })
					} else if (this.mode === `record`) {
						this.emit({ type: `set`, index, next: value })
					}
					return true
				}
				if (prop === `length`) {
					if (this.mode === `record`) {
						const prevLength = target.length
						if (prevLength === value) return true
						if (prevLength > value) {
							const dropped = target.slice(value)
							target.length = value
							this.emit({ type: `truncate`, length: value, items: dropped })
						} else {
							target.length = value
							this.emit({ type: `extend`, next: value, prev: prevLength })
						}
					} else {
						target.length = value
					}
					return true
				}
				return Reflect.set(target, prop, value, receiver)
			},
		})
	}

	public toJSON(): ReadonlyArray<P> {
		return [...this]
	}

	public static fromJSON<P extends primitive>(json: ReadonlyArray<P>): OList<P> {
		return new OList<P>(...json)
	}

	public push(...items: P[]): number {
		let result: number
		if (this.mode === `record`) {
			this.mode = `playback`
			result = super.push(...items)
			this.mode = `record`
			this.emit({ type: `push`, items })
		} else {
			result = super.push(...items)
		}
		return result
	}
	public pop(): P | undefined {
		let value: P | undefined
		if (this.mode === `record`) {
			this.mode = `playback`
			value = super.pop()
			if (value === undefined) {
				this.emit({ type: `pop` })
			} else {
				this.emit({ type: `pop`, value })
			}
			this.mode = `record`
		} else {
			value = super.pop()
		}
		return value
	}
	public shift(): P | undefined {
		let value: P | undefined
		if (this.mode === `record`) {
			this.mode = `playback`
			value = super.shift()
			if (value === undefined) {
				this.emit({ type: `shift` })
			} else {
				this.emit({ type: `shift`, value })
			}
			this.mode = `record`
		} else {
			value = super.shift()
		}
		return value
	}
	public unshift(...items: P[]): number {
		let result: number
		if (this.mode === `record`) {
			this.mode = `playback`
			result = super.unshift(...items)
			this.emit({ type: `unshift`, items })
			this.mode = `record`
		} else {
			result = super.unshift(...items)
		}
		return result
	}

	public reverse(): this {
		super.reverse()
		if (this.mode === `record`) {
			this.emit({ type: `reverse` })
		}
		return this
	}

	public fill(value: P, start?: number, end?: number): this {
		if (this.mode === `record`) {
			this.mode = `playback`
			const prev = this.slice(start, end)
			super.fill(value, start, end)
			if (start === undefined) {
				this.emit({ type: `fill`, value, prev })
			} else {
				if (end === undefined) {
					this.emit({ type: `fill`, value, start, prev })
				} else {
					this.emit({ type: `fill`, value, start, end, prev })
				}
			}
			this.mode = `record`
		} else {
			super.fill(value, start, end)
		}
		return this
	}

	public sort(compareFn?: (a: P, b: P) => number): this {
		if (this.mode === `record`) {
			this.mode = `playback`
			const prev = [...this]
			super.sort(compareFn)
			const next = [...this]
			this.emit({ type: `sort`, next, prev })
			this.mode = `record`
		}
		return this
	}

	public splice(start: number, deleteCount?: number): P[]
	public splice(start: number, deleteCount: number, ...items: P[]): P[]
	public splice(
		...params: [start: number, deleteCount?: number, ...items: P[]]
	): P[] {
		const [start, deleteCount, ...items] = params
		const originalMode = this.mode
		if (originalMode === `record`) this.mode = `playback`
		const deleted = super.splice(...(params as [number, number, ...P[]]))
		if (originalMode === `record`) this.mode = `record`
		if (deleteCount === undefined) {
			this.emit({
				type: `splice`,
				start,
				items,
				deleted,
				deleteCount: deleted.length,
			})
		} else {
			this.emit({ type: `splice`, start, items, deleted, deleteCount })
		}

		return deleted
	}

	public copyWithin(target: number, start: number, end?: number): this {
		const originalMode = this.mode
		let prev: P[] | undefined
		if (originalMode === `record`) {
			prev = this.slice(target)
			this.mode = `playback`
		}
		super.copyWithin(target, start, end)
		if (originalMode === `record`) this.mode = `record`
		if (prev) {
			if (end === undefined) {
				this.emit({ type: `copyWithin`, prev, target, start })
			} else {
				this.emit({ type: `copyWithin`, prev, target, start, end })
			}
		}
		return this
	}

	public subscribe(
		key: string,
		fn: (update: PackedArrayUpdate<P>) => void,
	): () => void {
		return this.subject.subscribe(key, fn)
	}

	public emit(update: ArrayUpdate<P>): void {
		this.subject.next(OList.packUpdate(update))
	}

	private doStep(update: ArrayUpdate<P>): void {
		const type = update.type
		switch (type) {
			case `copyWithin`:
				this.copyWithin(update.target, update.start, update.end)
				break
			case `extend`:
				this.length = update.next
				break
			case `fill`:
				this.fill(update.value, update.start, update.end)
				break
			case `pop`:
				this.pop()
				break
			case `push`:
				this.push(...update.items)
				break
			case `reverse`:
				this.reverse()
				break
			case `shift`:
				this.shift()
				break
			case `sort`:
				for (let i = 0; i < update.next.length; i++) {
					this[i] = update.next[i]
				}
				this.length = update.next.length
				break
			case `splice`:
				this.splice(update.start, update.deleteCount, ...update.items)
				break
			case `truncate`:
				this.length = update.length
				break
			case `set`:
				this[update.index] = update.next
				break
			case `unshift`:
				this.unshift(...update.items)
				break
		}
	}

	public do(update: PackedArrayUpdate<P>): null {
		this.mode = `playback`
		const unpacked = OList.unpackUpdate(update)
		this.doStep(unpacked)
		this.mode = `record`
		return null
	}

	public undoStep(update: ArrayUpdate<P>): void {
		switch (update.type) {
			case `copyWithin`:
				for (let i = 0; i < update.prev.length; i++) {
					this[i + update.target] = update.prev[i]
				}
				break
			case `extend`:
				this.length = update.prev
				break
			case `fill`:
				{
					const start = update.start ?? 0
					for (let i = 0; i < update.prev.length; i++) {
						this[i + start] = update.prev[i]
					}
				}
				break
			case `pop`:
				if (update.value) this.push(update.value)
				break
			case `push`:
				{
					let i = update.items.length - 1
					while (i >= 0) {
						this.pop()
						--i
					}
				}
				break
			case `reverse`:
				this.reverse()
				break
			case `shift`:
				if (update.value) this.unshift(update.value)
				break
			case `sort`:
				for (let i = 0; i < update.prev.length; i++) {
					this[i] = update.prev[i]
				}
				this.length = update.prev.length
				break
			case `set`:
				if (update.prev) {
					this[update.index] = update.prev
				} else {
					// eslint-disable-next-line @typescript-eslint/no-dynamic-delete
					delete this[update.index]
					const firstEmptyIndex = this.findIndex(
						(_, i) => !Object.hasOwn(this, i),
					)
					if (firstEmptyIndex !== -1) {
						this.length = firstEmptyIndex
					}
				}
				break
			case `splice`:
				this.splice(update.start, update.items.length, ...update.deleted)
				break
			case `truncate`:
				this.push(...update.items)
				break
			case `unshift`:
				{
					let i = update.items.length - 1
					while (i >= 0) {
						this.shift()
						--i
					}
				}
				break
		}
	}

	public undo(update: PackedArrayUpdate<P>): number | null {
		this.mode = `playback`
		const unpacked = OList.unpackUpdate(update)
		this.undoStep(unpacked)
		this.mode = `record`
		return null
	}

	public static packUpdate<P extends primitive>(
		update: ArrayUpdate<P>,
	): PackedArrayUpdate<P> {
		let packed = ARRAY_UPDATE_ENUM[update.type] + `\u001F`
		switch (update.type) {
			case `set`:
				packed += update.index + `\u001E` + packCanonical(update.next)
				if (update.prev !== undefined) {
					packed += `\u001E` + packCanonical(update.prev)
				}
				return packed
			case `truncate`:
				return (
					packed +
					update.length +
					`\u001E` +
					update.items.map(packCanonical).join(`\u001E`)
				)
			case `extend`:
				return packed + update.next + `\u001E` + update.prev
			case `pop`:
			case `shift`:
				if (update.value !== undefined) {
					packed += packCanonical(update.value)
				}
				return packed
			case `push`:
			case `unshift`:
				return packed + update.items.map(packCanonical).join(`\u001E`)
			case `copyWithin`:
				packed += update.target + `\u001E` + update.start
				if (update.end !== undefined) {
					packed += `\u001E` + update.end
				}
				packed += `\u001E\u001E` + update.prev.map(packCanonical).join(`\u001E`)
				return packed
			case `fill`:
				packed += packCanonical(update.value)
				if (update.start !== undefined) {
					packed += `\u001E` + update.start
				}
				if (update.end !== undefined) {
					packed += `\u001E` + update.end
				}
				packed += `\u001E\u001E` + update.prev.map(packCanonical).join(`\u001E`)
				return packed
			case `splice`:
				return (
					packed +
					update.start +
					`\u001E\u001E` +
					update.deleteCount +
					`\u001E\u001E` +
					update.items.map(packCanonical).join(`\u001E`) +
					`\u001E\u001E` +
					update.deleted.map(packCanonical).join(`\u001E`)
				)
			case `reverse`:
				return packed
			case `sort`:
				return (
					packed +
					update.next.map(packCanonical).join(`\u001E`) +
					`\u001E\u001E` +
					update.prev.map(packCanonical).join(`\u001E`)
				)
		}
	}

	public static unpackUpdate<P extends primitive>(
		packed: PackedArrayUpdate<P>,
	): ArrayUpdate<P> {
		const [head, tail] = packed.split(`\u001F`) as [
			Extract<keyof typeof ARRAY_UPDATE_ENUM, number>,
			packed<P>,
		]
		const type = ARRAY_UPDATE_ENUM[head]
		switch (type) {
			case `set`: {
				const [i, n, p] = tail.split(`\u001E`)
				const index = +i
				const next = unpackCanonical<P>(n)
				if (p === undefined) {
					return { type, index, next }
				}
				const prev = unpackCanonical<P>(p)
				return { type, index, next, prev }
			}
			case `truncate`: {
				const [l, ...i] = tail.split(`\u001E`)
				const length = +l
				const items = i.map<P>(unpackCanonical)
				return { type, length, items }
			}
			case `extend`: {
				const [n, p] = tail.split(`\u001E`)
				const next = +n
				const prev = +p
				return { type, next, prev }
			}
			case `pop`:
			case `shift`:
				if (tail !== ``) {
					const value = unpackCanonical(tail)
					return { type, value }
				}
				return { type }
			case `push`:
			case `unshift`: {
				const items = tail.split(`\u001E`).map<P>(unpackCanonical)
				return { type, items }
			}
			case `copyWithin`: {
				const [numbers, data] = tail.split(`\u001E\u001E`)
				const prev = data ? data.split(`\u001E`).map<P>(unpackCanonical) : []
				const [t, s, e] = numbers.split(`\u001E`)
				const target = +t
				const start = +s
				if (e === undefined) {
					return { type, target, start, prev }
				}
				const end = +e
				return { type, target, start, prev, end }
			}
			case `fill`: {
				const [numbers, data] = tail.split(`\u001E\u001E`)
				const prev = data ? data.split(`\u001E`).map<P>(unpackCanonical) : []
				const [v, s, e] = numbers.split(`\u001E`)
				const value = unpackCanonical<P>(v)
				if (s === undefined && e === undefined) {
					return { type, value, prev }
				}
				const start = +s
				if (e === undefined) {
					return { type, value, prev, start }
				}
				const end = +e
				return { type, value, prev, start, end }
			}
			case `splice`: {
				const [s, c, i, d] = tail.split(`\u001E\u001E`)

				const start = +s
				const deleteCount = +c
				const items = i ? i.split(`\u001E`).map<P>(unpackCanonical) : []
				const deleted = d ? d.split(`\u001E`).map<P>(unpackCanonical) : []
				return { type, start, deleteCount, items, deleted }
			}
			case `reverse`:
				return { type }
			case `sort`: {
				const [n, p] = tail.split(`\u001E\u001E`)
				const next = n ? n.split(`\u001E`).map<P>(unpackCanonical) : []
				const prev = p ? p.split(`\u001E`).map<P>(unpackCanonical) : []
				return { type, next, prev }
			}
		}
	}
}
