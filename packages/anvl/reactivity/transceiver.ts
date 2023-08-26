import { Subject } from "./subject"
import type { Json } from "../src/json"
import type { primitive } from "../src/primitive"

export type Transceiver<Signal extends Json.Serializable> = {
	do: (update: Signal) => void
	undo: (update: Signal) => void
	subscribe: (key: string, fn: (update: Signal) => void) => () => void
}

export type TransceiverMode = `playback` | `record`

export type SetUpdate = `add:${string}` | `clear:${string}` | `del:${string}`

export class TransceiverSet<P extends string>
	extends Set<P>
	implements Transceiver<SetUpdate>
{
	protected mode: TransceiverMode = `record`
	protected readonly subject = new Subject()

	public add(value: P): this {
		if (this.mode === `record`) {
			this.subject.next(`add:${value}`)
		}
		return super.add(value)
	}

	public clear(): void {
		if (this.mode === `record`) {
			this.subject.next(`clear:${JSON.stringify([...this])}`)
		}
		super.clear()
	}

	public delete(value: P): boolean {
		if (this.mode === `record`) {
			this.subject.next(`del:${value}`)
		}
		return super.delete(value)
	}

	public subscribe(key: string, fn: (update: SetUpdate) => void): () => void {
		return this.subject.subscribe(key, fn)
	}

	public do(update: SetUpdate): void {
		this.mode = `playback`
		const [type, value] = update.split(`:`)
		switch (type) {
			case `add`:
				this.add(value as P)
				break
			case `clear`:
				this.clear()
				break
			case `del`:
				this.delete(value as P)
				break
		}
		this.mode = `record`
	}

	public undo(update: SetUpdate): void {
		this.mode = `playback`
		const [type, value] = update.split(`:`)
		switch (type) {
			case `add`:
				this.delete(value as P)
				break
			case `del`:
				this.add(value as P)
				break
			case `clear`: {
				const values = JSON.parse(value) as P[]
				values.forEach((v) => this.add(v))
				break
			}
		}
		this.mode = `record`
	}
}
