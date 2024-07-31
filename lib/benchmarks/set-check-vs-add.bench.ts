import * as v from "vitest"

v.describe(`set add`, () => {
	const set = new Set()
	v.bench(`add`, () => {
		set.add(`a`)
	})
	v.bench(`check first`, () => {
		if (!set.has(`a`)) {
			set.add(`a`)
		}
	})
	v.bench(`add again`, () => {
		set.add(`a`)
	})
	v.bench(`check second`, () => {
		if (!set.has(`a`)) {
			set.add(`a`)
		}
	})
})
