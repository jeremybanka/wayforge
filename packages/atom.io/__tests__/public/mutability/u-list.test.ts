import type { primitive } from "atom.io/json"
import type { SetUpdate } from "atom.io/transceivers/u-list"
import { packSetUpdate, UList } from "atom.io/transceivers/u-list"

import * as U from "../../__util__"

beforeEach(() => {
	console.warn = () => undefined
	vitest.spyOn(console, `warn`)
	vitest.spyOn(U, `stdout`)
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
		it(`emits add - strings`, () => {
			const ul = new UList()
			U.handleBytes(ul.subject, U.stdout)
			ul.add(`z`)
			expect(U.stdout).toHaveBeenCalledExactlyOnceWith(48, 31, 3, 122)
		})
		it(`emits add - null`, () => {
			const ul = new UList()
			U.handleBytes(ul.subject, U.stdout)
			ul.add(null)
			// null doesn't need a value, just a type
			expect(U.stdout).toHaveBeenCalledExactlyOnceWith(48, 31, 2)
		})
		it(`emits delete - booleans`, () => {
			const ul = new UList([true, false])
			U.handleBytes(ul.subject, U.stdout)
			ul.delete(false)
			expect(U.stdout).toHaveBeenCalledExactlyOnceWith(49, 31, 1, 48)
		})
		it(`emits delete - numbers`, () => {
			const ul = new UList([13563])
			U.handleBytes(ul.subject, U.stdout)
			ul.delete(13563)
			expect(U.stdout).toHaveBeenCalledExactlyOnceWith(
				49,
				31,
				4,
				49, // 1
				51, // 3
				53, // 5
				54, // 6
				51, // 3
			)
		})
		it(`emits clear`, () => {
			const ul = new UList([1, 2, 3])
			U.handleBytes(ul.subject, U.stdout)
			ul.clear()
			expect(U.stdout).toHaveBeenCalledExactlyOnceWith(
				50, // "2" -- means clear
				31, // "US" -- unit separator, used to separate the method from the data
				4, // "EOT" -- originally, "end of transmission" but here means "number"
				49, // "1" -- the first value
				30, // "RS" -- record separator, used to separate data from each other
				4, // "number"
				50, // "2"
				30, // ","
				4, // "number"
				51, // "3"
			)
		})
		it(`should return a function that unsubscribes`, () => {
			const ul = new UList()
			const unsubscribe = ul.subscribe(`TEST`, U.stdout)
			unsubscribe()
			ul.add(`x`)
			expect(U.stdout).not.toHaveBeenCalled()
		})
	})
	describe(`do/undo`, () => {
		it(`should add a value to the ul - strings`, () => {
			const ul = new UList<string>()
			const update = packSetUpdate({
				type: `add`,
				value: `foo`,
			} satisfies SetUpdate<string>)
			ul.do(update)
			expect(ul.has(`foo`)).toBe(true)
			ul.undo(update)
			expect(ul.has(`foo`)).toBe(false)
		})
		it(`should add a value to the ul - numbers`, () => {
			const ul = new UList<number>()
			const update = packSetUpdate({
				type: `add`,
				value: 5,
			} satisfies SetUpdate<number>)
			ul.do(update)
			expect(ul.has(5)).toBe(true)
			ul.undo(update)
			expect(ul.has(5)).toBe(false)
		})
		it(`should add a value to the ul - null`, () => {
			const ul = new UList<null>()
			const update = packSetUpdate({
				type: `add`,
				value: null,
			} satisfies SetUpdate<null>)
			ul.do(update)
			expect(ul.has(null)).toBe(true)
			ul.undo(update)
			expect(ul.has(null)).toBe(false)
		})
		it(`should clear the ul - strings`, () => {
			const ul = new UList<string>(`y`)
			const update = packSetUpdate({
				type: `clear`,
				values: [`y`],
			} satisfies SetUpdate<string>)
			ul.do(update)
			expect(ul.size).toBe(0)
			ul.undo(update)
			expect(ul.size).toBe(1)
		})
		it(`should clear the ul - assorted`, () => {
			const ul = new UList<primitive>([3, `y`, null, false])
			const update = packSetUpdate({
				type: `clear`,
				values: [3, `y`, null, false],
			} satisfies SetUpdate<primitive>)
			ul.do(update)
			expect(ul.size).toBe(0)
			ul.undo(update)
			expect(ul.size).toBe(4)
		})
		it(`should delete a value from the ul`, () => {
			const ul = new UList([true])
			const update = packSetUpdate({
				type: `delete`,
				value: true,
			} satisfies SetUpdate<boolean>)
			ul.do(update)
			expect(ul.has(true)).toBe(false)
			ul.undo(update)
			expect(ul.has(true)).toBe(true)
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
