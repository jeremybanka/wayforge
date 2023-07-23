import { Join } from "../join"
import { isPlainObject } from "../object"

describe(`Join`, () => {
	it(`is not a plain object`, () => {
		expect(isPlainObject(Join)).toBe(false)
	})
})
