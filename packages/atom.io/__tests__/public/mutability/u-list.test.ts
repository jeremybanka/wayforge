import type { SetUpdate } from "atom.io/transceivers/u-list"
import { UList } from "atom.io/transceivers/u-list"

beforeEach(() => {
	console.warn = () => undefined
	vitest.spyOn(console, `warn`)
})

describe(`UList`, () => {
	describe(`constructor`, () => {
		it(`accepts nothing`, () => {
			const ul = new UList()
			expect(ul.size).toBe(0)
		})
		it(`accepts an array`, () => {
			const ul = new UList([`a`, `b`, `c`])
			expect(ul.size).toBe(3)
		})
		it(`accepts a Set`, () => {
			const ul = new UList(new Set([`a`, `b`, `c`]))
			expect(ul.size).toBe(3)
		})
		it(`accepts a UList`, () => {
			const ul = new UList([`a`, `b`, `c`])
			const ul2 = new UList(ul)
			expect(ul2.size).toBe(3)
		})
	})
	describe(`observe`, () => {
		it(`should call the function when the ul is updated`, () => {
			const ul = new UList()
			const fn = vitest.fn()
			ul.subscribe(`TEST`, fn)
			ul.add(`z`)
			expect(fn).toHaveBeenCalledWith({ type: `add`, value: `z` })
		})
		it(`should return a function that unsubscribes`, () => {
			const ul = new UList()
			const fn = vitest.fn()
			const unsubscribe = ul.subscribe(`TEST`, fn)
			unsubscribe()
			ul.add(`x`)
			expect(fn).not.toHaveBeenCalled()
		})
	})
	describe(`do/undo`, () => {
		it(`should add a value to the ul`, () => {
			const ul = new UList<string>()
			const update = { type: `add`, value: `foo` } satisfies SetUpdate<string>
			ul.do(update)
			expect(ul.has(`foo`)).toBe(true)
			ul.undo(update)
			expect(ul.has(`foo`)).toBe(false)
		})
		it(`should clear the ul`, () => {
			const ul = new UList<string>(`y`)
			const update = { type: `clear`, values: [`y`] } satisfies SetUpdate<string>
			ul.do(update)
			expect(ul.size).toBe(0)
			ul.undo(update)
			expect(ul.size).toBe(1)
		})
		it(`should delete a value from the ul`, () => {
			const ul = new UList(`x`)
			const update = { type: `delete`, value: `x` } satisfies SetUpdate<string>
			ul.do(update)
			expect(ul.has(`x`)).toBe(false)
			ul.undo(update)
			expect(ul.has(`x`)).toBe(true)
		})
	})

	describe(`serialization`, () => {
		it(`should return an array`, () => {
			const ul = new UList<string>([`a`, `b`, `c`])
			ul.add(`d`)
			ul.delete(`a`)
			const json = ul.toJSON()
			expect(json).toEqual([`b`, `c`, `d`])
			const ul2 = UList.fromJSON(json)
			expect(ul2).toEqual(ul)
		})
	})
})
