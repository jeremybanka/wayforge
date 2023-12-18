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
		it(`should add/delete a value from the set`, () => {
			const set = new SetRTX()
			set.add(`x`)
			set.add(`y`)
			set.delete(`y`)
			expect(set.has(`x`)).toBe(true)
			expect(set.has(`y`)).toBe(false)
			set.undo(`2=del:"y"`)
			expect(set.has(`y`)).toBe(true)
			set.undo(`1=add:"y"`)
			expect(set.has(`y`)).toBe(false)
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
		})
		it(`can be nested`, () => {
			const set = new SetRTX()
			const fn = vitest.fn()
			set.subscribe(`TEST`, fn)
			set.transaction((set) => {
				set.add(`x`)
				set.transaction((set) => {
					set.clear()
					set.add(`y`)
					set.add(`z`)
					set.delete(`y`)
					expect(fn).toHaveBeenCalledTimes(0)
					return true
				})
				expect(fn).toHaveBeenCalledTimes(0)
				return true
			})
		})
		it(`can be undone`, () => {
			const set = new SetRTX()
			let update: NumberedSetUpdate | undefined
			set.subscribe(`TEST`, (u) => (update = u))
			set.transaction((set) => {
				set.add(`x`)
				set.clear()
				set.add(`y`)
				set.add(`z`)
				set.delete(`y`)
				return true
			})
			set.undo(update as NumberedSetUpdate)
			expect(set.size).toBe(0)
		})
		it(`should not emit changes if the transaction is cancelled via throw`, () => {
			const set = new SetRTX()
			const fn = vitest.fn()
			set.subscribe(`TEST`, fn)
			let caught: Error | undefined
			try {
				set.transaction((set) => {
					set.add(`x`)
					set.clear()
					set.add(`y`)
					set.add(`z`)
					set.delete(`y`)
					expect(fn).toHaveBeenCalledTimes(0)
					throw new Error(`test`)
				})
			} catch (thrown) {
				if (thrown instanceof Error) {
					caught = thrown
				}
			}
			expect(fn).toHaveBeenCalledTimes(0)
			expect(caught?.message).toBe(`test`)
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
		it(`should return the anticipated update number when a wrong update number is provided`, () => {
			const set = new SetRTX()
			const res0 = set.do(`0=add:"foo"`)
			const res1 = set.do(`2=add:"bar"`)
			expect(res0).toBe(null)
			expect(res1).toBe(1)
			const res2 = set.undo(`1=add:"foo"`)
			expect(res2).toBe(0)
		})
		it(`should return "OUT_OF_RANGE" when the cache is too small to keep the number requested`, () => {
			const set = new SetRTX(undefined, 2)
			set.do(`0=add:"foo"`)
			set.do(`1=add:"bar"`)
			set.do(`2=add:"baz"`)
			const oor = set.do(`0=add:"qux"`)
			expect(oor).toBe(`OUT_OF_RANGE`)
		})
		it(`should return "OUT_OF_RANGE" when an update number is provided that is not within the cache`, () => {
			const set = new SetRTX(new Set([`foo`]), 10)
			set.cacheIdx = 0
			set.cacheUpdateNumber = 54
			set.cache[0] = `54=add:"foo"`
			const res = set.do(`53=add:"bar"`)
			expect(res).toBe(`OUT_OF_RANGE`)
		})
		it(`discards an update that has already been applied`, () => {
			const set = new SetRTX(undefined, 10)
			set.add(`x`)
			set.add(`y`)
			set.add(`z`)
			const res = set.do(`0=add:"x"`)
			expect(set.size).toBe(3)
			expect(res).toBe(null)
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
	describe(`getUpdateNumber`, () => {
		it(`should return the current update number`, () => {
			const set = new SetRTX()
			expect(set.getUpdateNumber(`0=add:1`)).toBe(0)
		})
	})
})
