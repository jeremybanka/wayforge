import type { Transceiver } from "~/packages/anvl/reactivity"
import { Subject } from "~/packages/anvl/reactivity"

export type JunctionUpdate_Set = `set:${string}:${string}`
export type JunctionUpdate_Delete = `del:${string}:${string}`
export type JunctionUpdate = JunctionUpdate_Delete | JunctionUpdate_Set

type JunctionData = {
	readonly relations: [string, string[]][]
}

const IDLE = 0
const RECORD = 1
const PLAYBACK = 2
export class Junction implements Transceiver<JunctionUpdate> {
	private mode = IDLE
	private readonly relations = new Map<string, Set<string>>()
	private readonly subject = new Subject<JunctionUpdate>()

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
		if (this.mode === IDLE) {
			this.mode = RECORD
		}
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
		if (this.mode === RECORD) {
			this.subject.next(`set:${a}:${b}`)
		}
		return this
	}
	public delete(a: string, b: string): this {
		if (this.mode === IDLE) {
			this.mode = RECORD
		}
		const setA = this.relations.get(a)
		if (!setA?.has(b)) {
			return this
		}
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
			if (this.mode === RECORD) {
				this.subject.next(`del:${a}:${b}`)
			}
		}
		this.mode = IDLE
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

	public do(update: JunctionUpdate): this {
		this.mode = PLAYBACK
		const [type, a, b] = update.split(`:`)
		switch (type) {
			case `set`:
				this.set(a, b)
				break
			case `del`:
				this.delete(a, b)
				break
		}
		this.mode = IDLE
		return this
	}

	public undo(update: JunctionUpdate): this {
		this.mode = PLAYBACK
		const [type, a, b] = update.split(`:`)
		switch (type) {
			case `set`:
				this.delete(a, b)
				break
			case `del`:
				this.set(a, b)
				break
		}
		this.mode = IDLE
		return this
	}

	public observe(fn: (update: JunctionUpdate) => void): () => void {
		return this.subject.subscribe(fn).unsubscribe
	}
}
