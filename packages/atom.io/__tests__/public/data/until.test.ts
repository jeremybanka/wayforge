import { until } from "atom.io/data"

describe(`until`, () => {
	it(`returns a placeholder instead of a promise`, () => {
		const result0 = until(new Promise(() => {}), null)
		expect(result0).toBe(null)
		const result1 = until(null, 10)
		expect(result1).toBe(null)
	})
})
