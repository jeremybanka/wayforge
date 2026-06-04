import * as v from "vitest"

v.describe(`clear array`, () => {
	v.bench(`setting length to 0`, () => {
		const arr = new Array(100)
		arr.length = 0
	})
	v.bench(`splicing`, () => {
		const arr = new Array(100)
		arr.splice(0, arr.length)
	})
})
