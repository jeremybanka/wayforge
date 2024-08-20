export class CircularBuffer<T> {
	protected _buffer: T[]
	protected _index = 0
	public constructor(array: T[])
	public constructor(length: number)
	public constructor(lengthOrArray: T[] | number) {
		let length: number
		if (typeof lengthOrArray === `number`) {
			length = lengthOrArray
		} else {
			length = lengthOrArray.length
		}
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

	public copy(): CircularBuffer<T> {
		const copy = new CircularBuffer<T>([...this._buffer])
		copy._index = this._index
		return copy
	}
}
