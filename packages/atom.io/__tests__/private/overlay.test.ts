import { MapOverlay, SetOverlay } from "atom.io/internal"

describe(`MapOverlay`, () => {
	test(`get`, () => {
		const base = new Map([
			[`a`, 1],
			[`b`, 2],
		])
		const overlay = new MapOverlay(base)
		expect(overlay.get(`a`)).toBe(1)
	})
	test(`set`, () => {
		const base = new Map([
			[`a`, 1],
			[`b`, 2],
		])
		const overlay = new MapOverlay(base)
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
		const overlay = new MapOverlay(base)
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
		const overlay = new MapOverlay(base)
		expect(overlay.has(`a`)).toBe(true)
		expect(overlay.has(`b`)).toBe(true)
		expect(overlay.has(`c`)).toBe(false)
	})
	test(`delete`, () => {
		const base = new Map([
			[`a`, 1],
			[`b`, 2],
		])
		const overlay = new MapOverlay(base)
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

describe(`SetOverlay`, () => {
	test(`constructor: binds source, starts empty overlay, initial size equals source.size`, () => {
		const source = new Set([`a`, `b`])
		const o = new SetOverlay(source)

		// initial structure
		expect(o.source).toBe(source)
		expect(o.deleted.size).toBe(0)

		// initial size reflects source (overlay empty)
		expect(o.size).toBe(source.size)

		// baseline: hasOwn vs has for source-backed keys
		expect(o.hasOwn(`a`)).toBe(false)
		expect(o.has(`a`)).toBe(true)
	})

	test(`add: adds new values not in source to overlay; returns this; hasOwn true`, () => {
		const source = new Set([`a`, `b`])
		const o = new SetOverlay<string>(source)

		const ret = o.add(`x`) // not in source → goes into overlay
		expect(ret).toBe(o) // chaining
		expect(o.hasOwn(`x`)).toBe(true)
		expect(o.has(`x`)).toBe(true)

		// size = overlay(1) + source(2) - deleted(0) = 3
		expect(o.size).toBe(3)

		// adding the same overlay value again should be a no-op and return this
		const ret2 = o.add(`x`)
		expect(ret2).toBe(o)
		expect(o.size).toBe(3) // still 3
	})

	test(`add: when value exists in source, does not add to overlay and clears deletion`, () => {
		const source = new Set([`a`, `b`])
		const o = new SetOverlay<string>(source)

		// Delete a source-backed key → goes into deleted and has() becomes false
		expect(o.delete(`a`)).toBe(true)
		expect(o.has(`a`)).toBe(false)
		expect(o.hasOwn(`a`)).toBe(false)
		expect(o.size).toBe(1) // source(2) - deleted(1) + overlay(0) = 1

		// Re-adding a source-backed key should just clear deletion; not added to overlay
		const ret = o.add(`a`)
		expect(ret).toBe(o)
		expect(o.has(`a`)).toBe(true)
		expect(o.hasOwn(`a`)).toBe(false)
		expect(o.size).toBe(2) // source(2) - deleted(0) + overlay(0) = 2

		// Adding a source-backed key that was never deleted is a no-op but still returns this
		const ret2 = o.add(`b`)
		expect(ret2).toBe(o)
		expect(o.has(`b`)).toBe(true)
		expect(o.hasOwn(`b`)).toBe(false)
	})

	test(`hasOwn only checks overlay; has checks overlay OR source minus deleted`, () => {
		const source = new Set([`a`, `b`])
		const o = new SetOverlay<string>(source)

		// overlay-only value
		o.add(`x`)
		expect(o.hasOwn(`x`)).toBe(true)
		expect(o.has(`x`)).toBe(true)

		// source-only value
		expect(o.hasOwn(`a`)).toBe(false)
		expect(o.has(`a`)).toBe(true)

		// deleted source value
		expect(o.delete(`a`)).toBe(true)
		expect(o.hasOwn(`a`)).toBe(false)
		expect(o.has(`a`)).toBe(false)

		// completely missing value
		expect(o.hasOwn(`zzz` as any)).toBe(false)
		expect(o.has(`zzz` as any)).toBe(false)
	})

	test(`delete: source-backed returns true and marks deleted (even when repeated)`, () => {
		const source = new Set([`a`])
		const o = new SetOverlay<string>(source)

		// First delete of a source-backed key
		expect(o.delete(`a`)).toBe(true)
		expect(o.has(`a`)).toBe(false)
		expect(o.size).toBe(0) // source(1)-deleted(1)+overlay(0)=0

		// Deleting the same source-backed key again still returns true by design
		expect(o.delete(`a`)).toBe(true)
		expect(o.has(`a`)).toBe(false)
		expect(o.size).toBe(0)

		// Re-add (clears deletion) via add(value) since in source
		o.add(`a`)
		expect(o.has(`a`)).toBe(true)
		expect(o.size).toBe(1)
	})

	test(`delete: overlay-only returns boolean from super.delete (true if existed, false otherwise)`, () => {
		const source = new Set<string>([])
		const o = new SetOverlay<string>(source)

		// overlay add
		o.add(`x`)
		expect(o.hasOwn(`x`)).toBe(true)
		expect(o.size).toBe(1)

		// delete overlay value → true, removed from overlay
		expect(o.delete(`x`)).toBe(true)
		expect(o.hasOwn(`x`)).toBe(false)
		expect(o.has(`x`)).toBe(false)
		expect(o.size).toBe(0)

		// deleting something nonexistent → false
		expect(o.delete(`nope`)).toBe(false)
	})

	test(`[Symbol.iterator]: yields overlay first (in insertion order), then source not deleted`, () => {
		const source = new Set([`a`, `b`, `c`])
		const o = new SetOverlay<string>(source)

		// overlay items (in this order)
		o.add(`x`)
		o.add(`y`)

		// delete one source item to ensure it is skipped in iteration
		expect(o.delete(`b`)).toBe(true)

		// iteration: overlay first, then source minus deleted, preserving each set's order
		const iterated = [...o]
		expect(iterated).toEqual([`x`, `y`, `a`, `c`])

		// sanity: hasOwn shows overlay only; source 'b' stays in source but is filtered
		expect(o.hasOwn(`x`)).toBe(true)
		expect(o.hasOwn(`a`)).toBe(false)
		expect(o.has(`b`)).toBe(false)
	})

	test(`iterateOwn(): yields only overlay entries (and in insertion order)`, () => {
		const source = new Set([`a`, `b`])
		const o = new SetOverlay<string>(source)

		o.add(`x`)
		o.add(`y`)

		// delete a source item to prove iterateOwn ignores source entirely
		o.delete(`a`)

		const own = [...o.iterateOwn()]
		expect(own).toEqual([`x`, `y`])
	})

	test(`size getter tracks overlay + source - deleted across operations`, () => {
		const source = new Set([`a`, `b`])
		const o = new SetOverlay<string>(source)

		// Start: 2
		expect(o.size).toBe(2)

		// Add overlay: +1
		o.add(`x`)
		expect(o.size).toBe(3)

		// Delete one source key: -1
		o.delete(`a`)
		expect(o.size).toBe(2)

		// Delete overlay key: -1
		o.delete(`x`)
		expect(o.size).toBe(1)

		// Re-add deleted source key via add (clears deletion): +1
		o.add(`a`)
		expect(o.size).toBe(2)
	})
})
