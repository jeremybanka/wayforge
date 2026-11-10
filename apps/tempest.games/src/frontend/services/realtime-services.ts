/** Share one realtime subscription until its last view consumer is disposed. */
const services = new WeakMap<
	object,
	Map<string, { count: number; dispose: () => void }>
>()

export function leaseRealtimeService(
	store: object,
	key: string,
	create: () => () => void,
): () => void {
	let registry = services.get(store)
	if (!registry) services.set(store, (registry = new Map()))
	let entry = registry.get(key)
	if (!entry) {
		entry = { count: 0, dispose: create() }
		registry.set(key, entry)
	}
	entry.count++
	let active = true
	return () => {
		if (!active) return
		active = false
		if (--entry.count === 0) {
			registry.delete(key)
			entry.dispose()
		}
	}
}
