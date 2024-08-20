export class CircularBuffer<T> {
	protected _buffer: T[]
	protected _index = 0
	public constructor(length: number) {
		this._buffer = Array.from({ length })
	}

	public get buffer(): ReadonlyArray<T | undefined> {
		return this._buffer
	}

	public get index(): number {
		return this._index
	}

	public add(item: T): void {
		this._buffer[this._index] = item
		this._index = (this._index + 1) % this._buffer.length
	}
}
