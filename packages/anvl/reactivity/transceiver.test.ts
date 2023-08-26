import type { SetUpdate } from "./transceiver"
import { TransceiverSet } from "./transceiver"

describe(`TransceiverSet`, () => {
	describe(`observe`, () => {
		it(`should call the function when the set is updated`, () => {
			const set = new TransceiverSet()
			const fn = vitest.fn()
			set.subscribe(`TEST`, fn)
			set.add(`z`)
			expect(fn).toHaveBeenCalledWith(`add:${JSON.stringify(`z`)}`)
		})
		it(`should return a function that unsubscribes`, () => {
			const set = new TransceiverSet()
			const fn = vitest.fn()
			const unsubscribe = set.subscribe(`TEST`, fn)
			unsubscribe()
			set.add(`x`)
			expect(fn).not.toHaveBeenCalled()
		})
	})
	describe(`do`, () => {
		it(`should add a value to the set`, () => {
			const set = new TransceiverSet()
			set.do(`add:foo`)
			expect(set.has(`foo`)).toBe(true)
		})
		it(`should clear the set`, () => {
			const set = new TransceiverSet()
			set.add(`y`)
			set.do(`clear:["y"]`)
			expect(set.size).toBe(0)
		})
		it(`should delete a value from the set`, () => {
			const set = new TransceiverSet()
			set.add(`x`)
			set.do(`del:x`)
			expect(set.has(`x`)).toBe(false)
		})
	})
	describe(`undo`, () => {
		it(`should delete a value from the set`, () => {
			const set = new TransceiverSet()
			set.add(`y`)
			set.undo(`add:y`)
			expect(set.has(`y`)).toBe(false)
		})
		it(`should recover a clear`, () => {
			const set = new TransceiverSet()
			let lastUpdate: SetUpdate | null = null
			set.subscribe(`TEST`, (u) => (lastUpdate = u))
			set.add(`x`)
			set.add(`y`)
			expect(set.size).toBe(2)
			set.clear()
			expect(set.size).toBe(0)
			if (lastUpdate) set.undo(lastUpdate)
			expect(set.size).toBe(2)
		})
	})
})
