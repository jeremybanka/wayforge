import type { UListUpdate } from "atom.io/transceivers/u-list"
import { UList } from "atom.io/transceivers/u-list"

beforeEach(() => {
	console.warn = () => undefined
	vitest.spyOn(console, `warn`)
})

const DEBUG_LOGS = false

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
			expect(fn).toHaveBeenCalledWith(`add:"z"`)
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
	describe(`do`, () => {
		it(`should add a value to the ul`, () => {
			const ul = new UList()
			ul.do(`add:"foo"`)
			expect(ul.has(`foo`)).toBe(true)
		})
		it(`should clear the ul`, () => {
			const ul = new UList()
			ul.add(`y`)
			ul.do(`clear:["y"]`)
			expect(ul.size).toBe(0)
		})
		it(`should delete a value from the ul`, () => {
			const ul = new UList()
			ul.add(`x`)
			ul.do(`del:"x"`)
			expect(ul.has(`"x"`)).toBe(false)
		})
	})
	describe(`undo`, () => {
		it(`should add/delete a value from the ul`, () => {
			const ul = new UList()
			ul.add(`x`)
			ul.add(`y`)
			ul.delete(`y`)
			expect(ul.has(`x`)).toBe(true)
			expect(ul.has(`y`)).toBe(false)
			ul.undo(`del:"y"`)
			expect(ul.has(`y`)).toBe(true)
			ul.undo(`add:"y"`)
			expect(ul.has(`y`)).toBe(false)
		})
		it(`should recover a clear`, () => {
			const ul = new UList()
			let lastUpdate: UListUpdate | null = null
			ul.subscribe(`TEST`, (u) => (lastUpdate = u))
			ul.add(`x`)
			ul.add(`y`)
			expect(ul.size).toBe(2)
			ul.clear()
			expect(ul.size).toBe(0)
			if (DEBUG_LOGS) console.log(ul, lastUpdate)
			let res: number | null = null
			if (lastUpdate) res = ul.undo(lastUpdate)
			if (DEBUG_LOGS) console.log(res)
			expect(ul.size).toBe(2)
		})
	})

	describe(`serialization`, () => {
		it(`should return an array`, () => {
			const ul = new UList<string>([`a`, `b`, `c`])
			ul.add(`d`)
			ul.delete(`a`)
			const json = ul.toJSON()
			expect(json).toEqual({
				members: [`b`, `c`, `d`],
			})
			const ul2 = UList.fromJSON(json)
			expect(ul2).toEqual(ul)
		})
	})
})
