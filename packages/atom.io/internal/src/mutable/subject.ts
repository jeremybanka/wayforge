export class Subject<T> {
	public Subscriber: (value: T) => void

	public subscribers: Map<string, this[`Subscriber`]> = new Map()

	public subscribe(key: string, subscriber: this[`Subscriber`]): () => void {
		this.subscribers.set(key, subscriber)
		const unsubscribe = () => this.unsubscribe(key)
		return unsubscribe
	}

	private unsubscribe(key: string) {
		this.subscribers.delete(key)
	}

	public next(value: T): void {
		for (const subscriber of this.subscribers.values()) {
			subscriber(value)
		}
	}
}
