import { isBoolean } from "fp-ts/boolean"
import { isNumber } from "fp-ts/number"
import { isString } from "fp-ts/string"

import { delve, redact, select } from "."
import type { integer } from "../json-schema/integer"
import { Int } from "../json-schema/integer"
import { ifDefined } from "../nullish"
import { modify } from "./modify"
import { hasExactProperties } from "./refinement"

describe(`hasExactProperties`, () => {
	it(`refines an empty object`, () => {
		const isEmptyObject = hasExactProperties({})
		expect(isEmptyObject({})).toBe(true)
	})
	it(`refines an object with keys of different types`, () => {
		const isMyFancyType = hasExactProperties({
			a: isString,
			b: isNumber,
			c: isBoolean,
		})
		const myFancyObject: unknown = JSON.parse(`{
      "a": "hello",
      "b": 42,
      "c": true
    }`)
		const doesMatch = isMyFancyType(myFancyObject)
		expect(doesMatch).toBe(true)
		if (doesMatch) {
			expect(myFancyObject.a).toBe(`hello`)
			expect(myFancyObject.b).toBe(42)
			expect(myFancyObject.c).toBe(true)
		}
	})
	it(`won't match an object with a missing key`, () => {
		const isMyFancyType = hasExactProperties({
			a: isString,
			b: isNumber,
			c: isBoolean,
		})
		const myFancyObject: unknown = JSON.parse(`{
      "a": "hello",
      "b": 42
    }`)
		expect(isMyFancyType(myFancyObject)).toBe(false)
	})
	it(`can handle optional properties with ifDefined`, () => {
		const isMyFancyType = hasExactProperties({
			a: isString,
			b: isNumber,
			c: ifDefined(isBoolean),
		})
		const myObj = {
			a: `hello`,
			b: 42,
			c: undefined,
		}
		expect(isMyFancyType(myObj)).toBe(true)
	})
})

describe(`delve`, () => {
	it(`is identity for an empty path`, () => {
		const result = delve({ a: 1 }, [])
		expect(result).toStrictEqual({ found: { a: 1 } })
	})
	it(`returns Error for a non-existent path`, () => {
		const result = delve({ a: 1 }, [`b`])
		expect(result).toStrictEqual(Error(`Not found`))
	})
	it(`returns the found value for an existing path`, () => {
		const result = delve({ a: 1 }, [`a`])
		expect(result).toStrictEqual({ found: 1 })
	})
	it(`returns the found value for a nested path`, () => {
		const result = delve({ a: { b: 1 } }, [`a`, `b`])
		expect(result).toStrictEqual({ found: 1 })
	})
	it(`returns the found value for a deeply nested path`, () => {
		const result = delve({ a: { b: { c: 1 } } }, [`a`, `b`, `c`])
		expect(result).toStrictEqual({ found: 1 })
	})
})

describe(`redact (Omit<Obj, Keys>)`, () => {
	it(`removes a property`, () => {
		const result = redact(`a`)({ a: 1, b: 2 })
		expect(result).toStrictEqual({ b: 2 })
	})
	it(`removes multiple properties`, () => {
		const result = redact(`a`, `b`)({ a: 1, b: 2, c: 3 })
		expect(result).toStrictEqual({ c: 3 })
	})
})

const G: Pick<{ a: number; b: integer; c: string }, `a` | `b`> = {
	a: 1,
	b: Int(2),
}

type MySelectable = { a: number; b?: string; c: boolean }

describe(`select (Pick<Obj, Keys>)`, () => {
	it(`returns a subset of an object`, () => {
		const result = select(`a`, `b`)({ a: 1, b: 2, c: 3 })
		expect(result).toStrictEqual({ a: 1, b: 2 })
	})
	it(`does not include properties that are not in the object`, () => {
		const result0 = select(`a`, `b`)({ a: 1, c: true })
		// @ts-expect-error c was not selected
		const { a, b, c } = result0
		console.log(b)
		const result1 = select(`a`, `b`)<MySelectable>({ a: 1, c: true })
		// @ts-expect-error c was not selected
		const { a: a1, b: b1, c: c1 } = result1
		console.log({ result0, result1 })
		expect(result0).toStrictEqual({ a: 1 })
	})
})

describe(`modify`, () => {
	it(`modifies a property`, () => {
		const result = modify({ a: `yo` })({ a: 1, b: 2 })
		expect(result).toStrictEqual({ a: `yo`, b: 2 })
	})
})
