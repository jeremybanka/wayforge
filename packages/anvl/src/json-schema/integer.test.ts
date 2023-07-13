import { Int, Frac } from "./integer"

describe(`Int`, () => {
	it(`parses integers`, () => {
		expect(Int(1)).toBe(1)
		expect(Int(-1)).toBe(-1)
		expect(Int(0)).toBe(0)
	})
	it(`throws an error if the input is not an integer`, () => {
		expect(() => Int(1.1)).toThrowError()
		expect(() => Int(`1`)).toThrowError()
		expect(() => Int(`1.1`)).toThrowError()
		expect(() => Int(`one`)).toThrowError()
	})
	it(`can behave as a number`, () => {
		const a = Int(1)
		const b = Int(2)
		const c = Int(a + b)
		expect(c).toBe(3)
		expect(Int(1) + 1).toBe(2)
		expect(Int(1) - 1).toBe(0)
		expect(Int(1) * 2).toBe(2)
		expect(Int(2) / 2).toBe(1)
		expect(Int(2) % 2).toBe(0)
	})
})

describe(`Fraction`, () => {
	it(`parses fractions`, () => {
		const oneHalf = Frac(1, 2)
		expect(oneHalf.numerator).toBe(1)
		expect(oneHalf.denominator).toBe(2)
	})
	it(`can behave as a number`, () => {
		const a = Frac(1, 2)
		const b = Frac(1, 2)
		expect(+a + +b).toBe(1)
	})
})
