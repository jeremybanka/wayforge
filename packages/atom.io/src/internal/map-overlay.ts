export class MapOverlay<K, V> extends Map<K, V> {
	public deleted: Set<K> = new Set()
	protected readonly source: Map<K, V>

	public constructor(source: Map<K, V>) {
		super()
		this.source = source
	}

	public get(key: K): V | undefined {
		const has = super.has(key)
		if (has) {
			return super.get(key)
		}
		if (!this.deleted.has(key) && this.source.has(key)) {
			const value = this.source.get(key)
			return value
		}
		return undefined
	}

	public set(key: K, value: V): this {
		this.deleted.delete(key)
		return super.set(key, value)
	}

	public hasOwn(key: K): boolean {
		return super.has(key)
	}

	public has(key: K): boolean {
		return !this.deleted.has(key) && (super.has(key) || this.source.has(key))
	}

	public delete(key: K): boolean {
		this.deleted.add(key)
		return super.delete(key)
	}
}

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

export class RelationsOverlay<K, V extends Set<any>> extends Map<K, V> {
	public deleted: Set<K> = new Set()
	protected readonly source: Map<K, V>

	public constructor(source: Map<K, V>) {
		super()
		this.source = source
	}

	public get(key: K): V | undefined {
		const has = super.has(key)
		if (has) {
			return super.get(key)
		}
		if (!this.deleted.has(key) && this.source.has(key)) {
			const value = this.source.get(key)
			const valueOverlay = new SetOverlay(value as V) as unknown as V
			super.set(key, valueOverlay)
			return valueOverlay
		}
		return undefined
	}

	public set(key: K, value: V): this {
		this.deleted.delete(key)
		return super.set(key, value)
	}

	public hasOwn(key: K): boolean {
		return super.has(key)
	}

	public has(key: K): boolean {
		return !this.deleted.has(key) && (super.has(key) || this.source.has(key))
	}

	public delete(key: K): boolean {
		this.deleted.add(key)
		return super.delete(key)
	}
}
