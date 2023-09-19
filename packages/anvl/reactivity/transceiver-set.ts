import type { primitive } from "../src/primitive"
import { Subject } from "./subject"
import type { Transceiver, TransceiverMode } from "./transceiver"

export type SetUpdate =
	| `add:${string}`
	| `clear:${string}`
	| `del:${string}`
	| `tx::${string}`

export class TransceiverSet<P extends primitive>
	extends Set<P>
	implements Transceiver<SetUpdate>
{
	protected mode: TransceiverMode = `record`
	protected readonly subject = new Subject<SetUpdate>()
	public id = Math.random().toString(36).slice(2)

	public add(value: P): this {
		if (this.mode === `record`) {
			this.subject.next(`add:${value}`)
		}
		if (this.transactionCore) {
			this.transactionCore.add(value)
			return this
		}
		return super.add(value)
	}

	public clear(): void {
		if (this.mode === `record`) {
			this.subject.next(`clear:${JSON.stringify([...this])}`)
		}
		if (this.transactionCore) {
			this.transactionCore.clear()
			return
		}
		super.clear()
	}

	public delete(value: P): boolean {
		if (this.mode === `record`) {
			this.subject.next(`del:${value}`)
		}
		if (this.transactionCore) {
			return this.transactionCore.delete(value)
		}
		return super.delete(value)
	}

	// TRANSACTIONS
	protected isTransactionCore = false
	public transactionCore: TransceiverSet<P> | null = null
	public transactionUpdates: SetUpdate[] | null = null
	public startTransaction(): void {
		if (this.isTransactionCore) {
			console.error(`Cannot start a transaction on a transaction core`)
			return
		}
		this.mode = `transaction`
		this.transactionUpdates = []
		this.transactionCore = new TransceiverSet(this)
		this.transactionCore.isTransactionCore = true
		this.transactionCore.subscribe(`transaction`, (update) => {
			this.transactionUpdates?.push(update)
		})
	}
	public applyTransaction(): void {
		if (this.transactionCore) {
			this.transactionCore = null
		} else {
			this.abortTransaction()
			return
		}
		if (this.transactionUpdates) {
			this.subject.next(`tx::${this.transactionUpdates.join(`;`)}`)
			this.doAll(this.transactionUpdates)
			this.transactionUpdates = null
		}
		this.mode = `record`
	}
	public abortTransaction(): void {
		this.transactionCore = null
		this.transactionUpdates = null
		this.mode = `record`
	}

	public subscribe(key: string, fn: (update: SetUpdate) => void): () => void {
		return this.subject.subscribe(key, fn)
	}

	private doStep(update: SetUpdate): void {
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
	}
	public do(update: SetUpdate): void {
		this.mode = `playback`
		this.doStep(update)
		this.mode = `record`
	}
	public doAll(updates: SetUpdate[]): void {
		this.mode = `playback`
		updates.forEach((update) => this.doStep(update))
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
