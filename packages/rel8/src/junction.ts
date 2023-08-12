import type { Transceiver } from "~/packages/anvl/reactivity"
import { Subject, TransceiverMode } from "~/packages/anvl/reactivity"

type JunctionData = {
	readonly relations: [string, string[]][]
}

export class Junction {
	protected readonly relations = new Map<string, Set<string>>()

	public constructor(data?: JunctionData) {
		if (data) {
			this.relations = new Map(data.relations.map(([a, b]) => [a, new Set(b)]))
		}
	}
	public toJSON(): JunctionData {
		return {
			relations: [...this.relations.entries()].map(([a, b]) => [a, [...b]]),
		}
	}

	public set(a: string, b: string): this {
		const aRelations = this.relations.get(a)
		const bRelations = this.relations.get(b)
		if (aRelations?.has(b)) {
			return this
		}
		if (aRelations) {
			aRelations.add(b)
		} else {
			this.relations.set(a, new Set([b]))
		}
		if (bRelations) {
			bRelations.add(a)
		} else {
			this.relations.set(b, new Set([a]))
		}

		return this
	}
	public delete(a: string, b: string): this {
		const setA = this.relations.get(a)
		if (setA) {
			setA.delete(b)
			if (setA.size === 0) {
				this.relations.delete(a)
			}
			const setB = this.relations.get(b)
			if (setB) {
				setB.delete(a)
				if (setB.size === 0) {
					this.relations.delete(b)
				}
			}
		}
		return this
	}

	public get(a: string): Set<string> | undefined {
		return this.relations.get(a)
	}

	public has(a: string, b?: string): boolean {
		if (b) {
			const setA = this.relations.get(a)
			return setA?.has(b) ?? false
		}
		return this.relations.has(a)
	}
}

export type JunctionUpdate =
	| `del:${string}:${string}`
	| `set:${string}:${string}`

export class JunctionTransceiver
	extends Junction
	implements Transceiver<JunctionUpdate>
{
	protected mode = TransceiverMode.Record
	protected readonly subject = new Subject<JunctionUpdate>()

	public set(a: string, b: string): this {
		super.set(a, b)
		if (this.mode === TransceiverMode.Record) {
			this.subject.next(`set:${a}:${b}`)
		}
		return this
	}
	public delete(a: string, b: string): this {
		const setA = this.relations.get(a)
		if (!setA?.has(b)) {
			return this
		}
		super.delete(a, b)
		if (this.mode === TransceiverMode.Record) {
			this.subject.next(`del:${a}:${b}`)
		}

		return this
	}

	public do(update: JunctionUpdate): this {
		this.mode = TransceiverMode.Playback
		const [type, a, b] = update.split(`:`)
		switch (type) {
			case `set`:
				this.set(a, b)
				break
			case `del`:
				this.delete(a, b)
				break
		}
		this.mode = TransceiverMode.Record
		return this
	}

	public undo(update: JunctionUpdate): this {
		this.mode = TransceiverMode.Playback
		const [type, a, b] = update.split(`:`)
		switch (type) {
			case `set`:
				this.delete(a, b)
				break
			case `del`:
				this.set(a, b)
				break
		}
		this.mode = TransceiverMode.Record
		return this
	}

	public observe(fn: (update: JunctionUpdate) => void): () => void {
		return this.subject.subscribe(fn).unsubscribe
	}
}
