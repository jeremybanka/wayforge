export class SetOverlay<K> extends Set<K> {
	public deleted: Set<K> = new Set()
	public source: Set<K>

	public constructor(source: Set<K>) {
		super()
		this.source = source
	}

	public add(value: K): this {
		if (this.source.has(value)) {
			this.deleted.delete(value)
			return this
		}
		return super.add(value)
	}

	public hasOwn(key: K): boolean {
		return super.has(key)
	}

	public has(key: K): boolean {
		return !this.deleted.has(key) && (super.has(key) || this.source.has(key))
	}

	public delete(key: K): boolean {
		if (this.source.has(key)) {
			this.deleted.add(key)
			return true
		}
		return super.delete(key)
	}

	public *[Symbol.iterator](): SetIterator<K> {
		yield* super[Symbol.iterator]()
		for (const value of this.source) {
			if (!this.deleted.has(value)) {
				yield value
			}
		}
	}

	public *iterateOwn(): SetIterator<K> {
		yield* super[Symbol.iterator]()
	}

	public get size(): number {
		return super.size + this.source.size - this.deleted.size
	}
}
