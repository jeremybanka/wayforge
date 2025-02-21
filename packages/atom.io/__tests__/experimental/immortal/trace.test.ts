import { getTrace } from "atom.io/internal"

describe(`getTrace`, () => {
	test(`returns the stack trace`, () => {
		const error = new Error(`whoops`)
		expect(getTrace(error)).toContain(import.meta.filename)
	})
	test(`for an error with no stack, returns an empty string`, () => {
		const error = new Error(`whoops`)
		Object.defineProperty(error, `stack`, { value: undefined })
		expect(getTrace(error)).toBe(``)
	})
})
