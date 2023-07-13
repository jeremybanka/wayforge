import type { Fragment } from "./patch"
import { patch } from "./patch"

describe(`merge`, () => {
	it(`should merge JSON`, () => {
		const base = {
			a: [1, 2, 3],
			b: {
				c: 4,
				d: 5,
			},
		}
		const fragment: Fragment<typeof base> = {
			a: [4],
			b: {
				c: 6,
			},
		}
		const result = patch(base, fragment)
		expect(result).toEqual({
			a: [1, 2, 3, 4],
			b: {
				c: 6,
				d: 5,
			},
		})
	})
})
