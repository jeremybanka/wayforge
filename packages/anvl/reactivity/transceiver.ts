import { Subject } from "./subject"
import type { Json } from "../src/json"
import type { primitive } from "../src/primitive"

export type Transceiver<Signal extends Json.Serializable> = {
	do: (update: Signal) => void
	undo: (update: Signal) => void
	observe: (fn: (update: Signal) => void) => () => void
}

export type TransceiverMode = `playback` | `record`

export type SetUpdate = `add:${string}` | `clear:${string}` | `del:${string}`

export class TransceiverSet<P extends primitive>
	extends Set<P>
	implements Transceiver<SetUpdate>
{
	protected mode: TransceiverMode = `record`
	protected readonly subject = new Subject()

	public add(value: P): this {
		if (this.mode === `record`) {
			this.subject.next(`add:${JSON.stringify(value)}`)
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
			this.subject.next(`del:${JSON.stringify(value)}`)
		}
		return super.delete(value)
	}

	public observe(fn: (update: SetUpdate) => void): () => void {
		return this.subject.subscribe(fn).unsubscribe
	}

	public do(update: SetUpdate): void {
		this.mode = `playback`
		const [type, value] = update.split(`:`)
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
		}
		this.mode = `record`
	}

	public undo(update: SetUpdate): void {
		this.mode = `playback`
		const [type, value] = update.split(`:`)
		switch (type) {
			case `add`:
				this.delete(JSON.parse(value))
				break
			case `del`:
				this.add(JSON.parse(value))
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
