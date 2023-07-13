import { isString } from "fp-ts/string"

import { fractalMap, isFractalArray, prune } from "./fractal-array"

describe(`refinement: isFractalArray`, () => {
	it(`should pass [<T>]`, () => {
		expect(isFractalArray(isString)([``])).toBe(true)
	})
	it(`should fail <T>`, () => {
		expect(isFractalArray(isString)(``)).toBe(false)
	})
	it(`should pass [<T>[<T>]]`, () => {
		expect(isFractalArray(isString)([``, [``]])).toBe(true)
	})
})

describe(`fractalMap`, () => {
	it(`should increment all numbers`, () => {
		const array = [[1, 2, [3, 4]], 5, [6]]
		const mapper = (value: number) => value + 1
		expect(fractalMap(array, mapper)).toEqual([[2, 3, [4, 5]], 6, [7]])
	})
})

describe(`prune`, () => {
	it(`should eliminate all instances of "b"`, () => {
		const array = [`a`, [`b`, `c`, [[`b`]]], `d`]
		const predicate = (value: string) => value !== `b`
		expect(prune(array, predicate)).toEqual([`a`, [`c`, [[]]], `d`])
	})
})
