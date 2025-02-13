import { sampleFunction } from "./sample-source-with-a-very-long-name"

test(`sampleFunction`, () => {
	expect(sampleFunction(false)).toBe(false)
})
