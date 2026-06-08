import { Future } from "./future"

export type CoalescedSubscriberData = {
	refcount: number
	timer: Future<void>
}

export type CoalescedSubscriberMap<K> = {
	delete: (key: K) => unknown
	get: (key: K) => CoalescedSubscriberData | undefined
	set: (key: K, value: CoalescedSubscriberData) => unknown
}

function never(): Promise<void> {
	return new Promise<void>(() => {})
}

export function createCoalescedSubscriber<K>(
	subscriptions: CoalescedSubscriberMap<K>,
	key: K,
	open: (key: K) => () => void,
	coalesceMs: number,
): () => void {
	let subscription = subscriptions.get(key)

	if (subscription) {
		subscription.timer.use(never())
		subscription.refcount++
	} else {
		subscription = { refcount: 1, timer: new Future<void>(never()) }
		subscriptions.set(key, subscription)
		const close = open(key)
		void subscription.timer.then(() => {
			close()
			subscriptions.delete(key)
		})
	}

	let unsubscribed = false
	return () => {
		if (unsubscribed) {
			return
		}
		unsubscribed = true
		subscription.refcount--

		if (subscription.refcount === 0) {
			subscription.timer.use(
				new Promise<void>((resolve) => {
					setTimeout(resolve, coalesceMs)
				}),
			)
		}
	}
}
