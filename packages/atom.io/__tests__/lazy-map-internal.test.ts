import { LazyMap } from "atom.io/internal"

it(`LazyProxyMap`, () => {
	const base = new Map([
		[`a`, 1],
		[`b`, 2],
	])
	const proxy = new LazyMap(base)
	expect(proxy.get(`a`)).toBe(1)
})
