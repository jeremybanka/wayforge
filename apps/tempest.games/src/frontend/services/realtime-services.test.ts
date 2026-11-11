import { leaseRealtimeService } from "./realtime-services"

it(`keeps a shared pull alive while another mounted view still consumes it`, () => {
	const store = {}
	const dispose = vi.fn()
	const create = vi.fn(() => dispose)
	const first = leaseRealtimeService(store, `pull:tiles`, create)
	const second = leaseRealtimeService(store, `pull:tiles`, create)
	first()
	first()
	expect(create).toHaveBeenCalledTimes(1)
	expect(dispose).not.toHaveBeenCalled()
	second()
	expect(dispose).toHaveBeenCalledTimes(1)
	const remounted = leaseRealtimeService(store, `pull:tiles`, create)
	expect(create).toHaveBeenCalledTimes(2)
	remounted()
	expect(dispose).toHaveBeenCalledTimes(2)
})

it(`isolates subscriptions for different stores and tokens`, () => {
	const firstStore = {}
	const secondStore = {}
	const dispose = vi.fn()
	const create = vi.fn(() => dispose)
	const releases = [
		leaseRealtimeService(firstStore, `pull:tiles`, create),
		leaseRealtimeService(firstStore, `pull:players`, create),
		leaseRealtimeService(secondStore, `pull:tiles`, create),
	]
	expect(create).toHaveBeenCalledTimes(3)
	for (const release of releases) release()
	expect(dispose).toHaveBeenCalledTimes(3)
})

it(`allows retrying a subscription that failed during setup`, () => {
	const store = {}
	expect(() =>
		leaseRealtimeService(store, `pull:tiles`, () => {
			throw new Error(`disconnected`)
		}),
	).toThrow(`disconnected`)
	const dispose = vi.fn()
	leaseRealtimeService(store, `pull:tiles`, () => dispose)()
	expect(dispose).toHaveBeenCalledOnce()
})
