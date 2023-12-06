import { LazyMap } from "atom.io/internal"
import { e } from "vitest/dist/reporters-LLiOBu3g"

describe(`LazyMap`, () => {
	test(`get`, () => {
		const base = new Map([
			[`a`, 1],
			[`b`, 2],
		])
		const overlay = new LazyMap(base)
		expect(overlay.get(`a`)).toBe(1)
	})
	test(`set`, () => {
		const base = new Map([
			[`a`, 1],
			[`b`, 2],
		])
		const overlay = new LazyMap(base)
		expect(base.get(`a`)).toBe(1)
		expect(overlay.get(`a`)).toBe(1)
		expect(overlay.set(`a`, 2)).toBe(overlay)
		expect(base.get(`a`)).toBe(1)
		expect(overlay.get(`a`)).toBe(2)
	})
	test(`hasOwn`, () => {
		const base = new Map([
			[`a`, 1],
			[`b`, 2],
		])
		const overlay = new LazyMap(base)
		expect(overlay.hasOwn(`a`)).toBe(false)
		expect(overlay.has(`a`)).toBe(true)
		overlay.set(`a`, 2)
		expect(overlay.hasOwn(`a`)).toBe(true)
	})
	test(`has`, () => {
		const base = new Map([
			[`a`, 1],
			[`b`, 2],
		])
		const overlay = new LazyMap(base)
		expect(overlay.has(`a`)).toBe(true)
		expect(overlay.has(`b`)).toBe(true)
		expect(overlay.has(`c`)).toBe(false)
	})
	test(`delete`, () => {
		const base = new Map([
			[`a`, 1],
			[`b`, 2],
		])
		const overlay = new LazyMap(base)
		expect(overlay.delete(`a`)).toBe(false)
		expect(overlay.has(`a`)).toBe(false)
		expect(overlay.get(`a`)).toBe(undefined)
		expect(base.has(`a`)).toBe(true)
		expect(base.get(`a`)).toBe(1)
		overlay.set(`a`, 2)
		expect(overlay.has(`a`)).toBe(true)
		expect(overlay.get(`a`)).toBe(2)
	})
})
