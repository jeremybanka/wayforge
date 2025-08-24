export class MapOverlay<K, V> extends Map<K, V> {
	public deleted: Set<K> = new Set()
	public changed: Set<K> = new Set()
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
		if (this.source.has(key)) {
			this.changed.add(key)
		}
		return super.set(key, value)
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
			this.changed.delete(key)
		}
		return super.delete(key)
	}

	public clear(): void {
		this.deleted = new Set(this.source.keys())
		this.changed.clear()
		super.clear()
	}

	public *[Symbol.iterator](): MapIterator<[K, V]> {
		yield* super[Symbol.iterator]()
		for (const [key, value] of this.source) {
			if (!this.deleted.has(key) && !this.changed.has(key)) {
				yield [key, value]
			}
		}
	}
	public *entries(): MapIterator<[K, V]> {
		yield* this[Symbol.iterator]()
	}
	public *keys(): MapIterator<K> {
		yield* super.keys()
		for (const key of this.source.keys()) {
			if (!this.deleted.has(key) && !this.changed.has(key)) {
				yield key
			}
		}
	}
	public *values(): MapIterator<V> {
		for (const [, value] of this[Symbol.iterator]()) {
			yield value
		}
	}
	public forEach(callbackfn: (value: V, key: K, map: Map<K, V>) => void): void {
		for (const [key, value] of this[Symbol.iterator]()) {
			callbackfn(value, key, this)
		}
	}

	public get size(): number {
		return super.size + this.source.size - this.changed.size - this.deleted.size
	}
}
