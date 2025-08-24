export class SetOverlay<T> extends Set<T> {
	public deleted: Set<T> = new Set()
	public source: Set<T>

	public constructor(source: Set<T>) {
		super()
		this.source = source
	}

	public add(value: T): this {
		if (this.source.has(value)) {
			this.deleted.delete(value)
			return this
		}
		return super.add(value)
	}

	public hasOwn(member: T): boolean {
		return super.has(member)
	}

	public has(key: T): boolean {
		return !this.deleted.has(key) && (super.has(key) || this.source.has(key))
	}

	public delete(key: T): boolean {
		if (this.source.has(key)) {
			this.deleted.add(key)
			return true
		}
		return super.delete(key)
	}

	public clear(): void {
		this.deleted = new Set(this.source)
		super.clear()
	}

	public *[Symbol.iterator](): SetIterator<T> {
		yield* super[Symbol.iterator]()
		for (const value of this.source) {
			if (!this.deleted.has(value)) {
				yield value
			}
		}
	}

	public *iterateOwn(): SetIterator<T> {
		yield* super[Symbol.iterator]()
	}

	public get size(): number {
		return super.size + this.source.size - this.deleted.size
	}
}
