export class Subject<T> {
	public Subscriber: (value: T) => void

	public subscribers: Map<string, this[`Subscriber`]> = new Map()

	public subscribe(key: string, subscriber: this[`Subscriber`]): () => void {
		this.subscribers.set(key, subscriber)
		const unsubscribe = () => {
			this.unsubscribe(key)
		}
		return unsubscribe
	}

	private unsubscribe(key: string) {
		this.subscribers.delete(key)
	}

	public next(value: T): void {
		const subscribers = this.subscribers.values()
		for (const subscriber of subscribers) {
			subscriber(value)
		}
	}
}

export class StatefulSubject<T> extends Subject<T> {
	public state: T

	public constructor(initialState: T) {
		super()
		this.state = initialState
	}

	public next(value: T): void {
		this.state = value
		super.next(value)
	}
}
