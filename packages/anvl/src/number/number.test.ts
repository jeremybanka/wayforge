import { clampInto } from "./clamp"
import { wrapInto } from "./wrap"

describe(`wrapInto`, () => {
	it(`should wrap a number into a range`, () => {
		expect(wrapInto([0, 10])(-21)).toBe(9)
		expect(wrapInto([0, 10])(11)).toBe(1)
		expect(wrapInto([0, 10])(5)).toBe(5)
	})
})
describe(`clampInto`, () => {
	it(`should clamp a number into a range`, () => {
		expect(clampInto([0, 10])(-21)).toBe(0)
		expect(clampInto([0, 10])(11)).toBe(10)
		expect(clampInto([0, 10])(5)).toBe(5)
	})
})
