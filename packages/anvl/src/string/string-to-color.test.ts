import { stringToColor } from "./string-to-color"

describe(`stringToColor`, () => {
	it(`should return a color`, () => {
		const result = stringToColor(`test`)
		console.log(result)
		expect(result).toMatch(/^#[0-9a-f]{6}$/)
	})
})
