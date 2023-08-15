import type { SetUpdate } from "./transceiver"
import { TransceiverSet } from "./transceiver"

describe(`TransceiverSet`, () => {
	describe(`observe`, () => {
		it(`should call the function when the set is updated`, () => {
			const set = new TransceiverSet()
			const fn = vitest.fn()
			set.observe(fn)
			set.add(1)
			expect(fn).toHaveBeenCalledWith(`add:${JSON.stringify(1)}`)
		})
		it(`should return a function that unsubscribes`, () => {
			const set = new TransceiverSet()
			const fn = vitest.fn()
			const unsubscribe = set.observe(fn)
			unsubscribe()
			set.add(1)
			expect(fn).not.toHaveBeenCalled()
		})
	})
	describe(`do`, () => {
		it(`should add a value to the set`, () => {
			const set = new TransceiverSet()
			set.do(`add:1`)
			expect(set.has(1)).toBe(true)
		})
		it(`should clear the set`, () => {
			const set = new TransceiverSet()
			set.add(1)
			set.do(`clear:[1]`)
			expect(set.size).toBe(0)
		})
		it(`should delete a value from the set`, () => {
			const set = new TransceiverSet()
			set.add(1)
			set.do(`del:1`)
			expect(set.has(1)).toBe(false)
		})
	})
	describe(`undo`, () => {
		it(`should delete a value from the set`, () => {
			const set = new TransceiverSet()
			set.add(1)
			set.undo(`add:1`)
			expect(set.has(1)).toBe(false)
		})
		it(`should recover a clear`, () => {
			const set = new TransceiverSet()
			let lastUpdate: SetUpdate | null = null
			set.observe((u) => (lastUpdate = u))
			set.add(1)
			set.add(2)
			expect(set.size).toBe(2)
			set.clear()
			expect(set.size).toBe(0)
			if (lastUpdate) set.undo(lastUpdate)
			expect(set.size).toBe(2)
		})
	})
})
