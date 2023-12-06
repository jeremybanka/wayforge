import type { NumberedSetUpdate } from "atom.io/transceivers/set-rtx"
import { SetRTX } from "atom.io/transceivers/set-rtx"

describe(`SetRTX`, () => {
	describe(`constructor`, () => {
		it(`accepts nothing`, () => {
			const set = new SetRTX()
			expect(set.size).toBe(0)
		})
		it(`accepts an array`, () => {
			const set = new SetRTX([`a`, `b`, `c`])
			expect(set.size).toBe(3)
		})
		it(`accepts a Set`, () => {
			const set = new SetRTX(new Set([`a`, `b`, `c`]))
			expect(set.size).toBe(3)
		})
		it
		it(`accepts a SetRTX`, () => {
			const set = new SetRTX([`a`, `b`, `c`])
			const set2 = new SetRTX(set)
			expect(set2.size).toBe(3)
		})
	})
	describe(`observe`, () => {
		it(`should call the function when the set is updated`, () => {
			const set = new SetRTX()
			const fn = vitest.fn()
			set.subscribe(`TEST`, fn)
			set.add(`z`)
			expect(fn).toHaveBeenCalledWith(`0=add:"z"`)
		})
		it(`should return a function that unsubscribes`, () => {
			const set = new SetRTX()
			const fn = vitest.fn()
			const unsubscribe = set.subscribe(`TEST`, fn)
			unsubscribe()
			set.add(`x`)
			expect(fn).not.toHaveBeenCalled()
		})
	})
	describe(`do`, () => {
		it(`should add a value to the set`, () => {
			const set = new SetRTX()
			set.do(`0=add:"foo"`)
			expect(set.has(`foo`)).toBe(true)
		})
		it(`should clear the set`, () => {
			const set = new SetRTX()
			set.add(`y`)
			set.do(`1=clear:["y"]`)
			expect(set.size).toBe(0)
		})
		it(`should delete a value from the set`, () => {
			const set = new SetRTX()
			set.add(`x`)
			set.do(`1=del:"x"`)
			expect(set.has(`"x"`)).toBe(false)
		})
	})
	describe(`undo`, () => {
		it(`should delete a value from the set`, () => {
			const set = new SetRTX()
			set.add(`y`)
			set.undo(`0=add:"y"`)
			expect(set.has(`"y"`)).toBe(false)
		})
		it(`should recover a clear`, () => {
			const set = new SetRTX()
			let lastUpdate: NumberedSetUpdate | null = null
			set.subscribe(`TEST`, (u) => (lastUpdate = u))
			set.add(`x`)
			console.log(set.cacheUpdateNumber, set.cache)
			set.add(`y`)
			console.log(set.cacheUpdateNumber, set.cache)
			expect(set.size).toBe(2)
			set.clear()
			console.log(set.cacheUpdateNumber, set.cache)
			expect(set.size).toBe(0)
			console.log(set, lastUpdate)
			let res
			if (lastUpdate) res = set.undo(lastUpdate)
			console.log(res)
			expect(set.size).toBe(2)
		})
	})
	describe(`transaction`, () => {
		it(`should emit three changes`, () => {
			const set = new SetRTX()
			const fn = vitest.fn()
			set.subscribe(`TEST`, fn)
			set.transaction((set) => {
				set.add(`x`)
				set.clear()
				set.add(`y`)
				set.add(`z`)
				set.delete(`y`)
				expect(fn).toHaveBeenCalledTimes(0)
				return true
			})
			expect(fn).toHaveBeenCalledTimes(1)
			expect(fn).toHaveBeenCalledWith(
				`0=tx:add:"x";clear:["x"];add:"y";add:"z";del:"y"`,
			)
		})
	})
	describe(`rollback`, () => {
		it(`should quickly undo false history`, () => {
			const set = new SetRTX(undefined, 10)
			set.add(1)
			console.log(set.cacheUpdateNumber, set.cache)
			set.add(2)
			console.log(set.cacheUpdateNumber, set.cache)
			set.add(3)
			console.log(set.cacheUpdateNumber, set.cache)
			console.log({ set })
			const res = set.do(`0=add:0`)
			console.log({ set, res })
			expect(set.size).toBe(1)
		})
	})
	describe(`serialization`, () => {
		it(`should return an array`, () => {
			const set = new SetRTX<string>([`a`, `b`, `c`])
			set.add(`d`)
			set.delete(`a`)
			const json = set.toJSON()
			expect(json).toEqual({
				cacheUpdateNumber: 1,
				members: [`b`, `c`, `d`],
				cache: [],
				cacheIdx: -1,
				cacheLimit: 0,
			})
			const set2 = SetRTX.fromJSON(json)
			expect(set2).toEqual(set)
		})
	})
})
