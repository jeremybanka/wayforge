type Subscriber<T> = (value: T) => void

export class Subject<T> {
	public subscribers: Map<string, Subscriber<T>> = new Map()

	public subscribe(key: string, subscriber: Subscriber<T>): () => void {
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
