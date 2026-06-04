import * as v from "vitest"

v.describe(`plus plus`, () => {
	v.bench(`before`, () => {
		let i = 0
		for (const char of `abcdefghijklmnopqrstuvwxyz`) {
			++i
		}
	})
	v.bench(`after`, () => {
		let i = 0
		for (const char of `abcdefghijklmnopqrstuvwxyz`) {
			i++
		}
	})
})
