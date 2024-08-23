import { isJson } from "atom.io/json"

describe(`isJson`, () => {
	it(`knows whether an unknown is a Json.Tree.Node`, () => {
		expect(isJson(null)).toBe(true)
		expect(isJson([])).toBe(true)
		expect(isJson([0])).toBe(true)
		expect(isJson([0n])).toBe(true)
		expect(isJson({})).toBe(true)
		expect(isJson({ a: 0 })).toBe(true)
		expect(isJson({ a: 0n })).toBe(true)
		expect(isJson(``)).toBe(true)
		expect(isJson(true)).toBe(true)
		expect(isJson(false)).toBe(true)
		expect(isJson(0)).toBe(true)
		expect(isJson(undefined)).toBe(false)
		expect(isJson(0n)).toBe(false)
		expect(isJson(() => null)).toBe(false)
		expect(isJson(new Set())).toBe(false)
	})
})
