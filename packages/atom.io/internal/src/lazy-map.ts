export class LazyMap<K, V> extends Map<K, V> {
	public deleted = new Set<K>()

	public constructor(protected readonly source: Map<K, V>) {
		super()
	}

	public get(key: K): V | undefined {
		const has = super.has(key)
		if (has) {
			return super.get(key)
		}
		if (!this.deleted.has(key) && this.source.has(key)) {
			const value = this.source.get(key)
			super.set(key, value as V)
			return value
		}
		return undefined
	}

	public _has(key: K): boolean {
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
