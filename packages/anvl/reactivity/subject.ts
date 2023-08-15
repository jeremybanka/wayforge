type Subscriber<T> = (value: T) => void

export class Subject<T> {
	public subscribers: Subscriber<T>[] = []

	public subscribe(subscriber: Subscriber<T>): { unsubscribe: () => void } {
		this.subscribers.push(subscriber)
		const unsubscribe = () => this.unsubscribe(subscriber)
		return { unsubscribe }
	}

	private unsubscribe(subscriber: Subscriber<T>) {
		const subscriberIndex = this.subscribers.indexOf(subscriber)
		if (subscriberIndex !== -1) {
			this.subscribers.splice(subscriberIndex, 1)
		}
	}

	public next(value: T): void {
		for (const subscriber of this.subscribers) {
			subscriber(value)
		}
	}
}
