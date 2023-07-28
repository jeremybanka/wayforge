import { Refinery } from "./refinery"

const myRefinery = new Refinery({
	Set,
	Map,
})

const a = myRefinery.refine(new Set([1, 2, 3]))

if (a !== null) {
	if (a.type === `Set`) {
		a.data
	} else {
		a.data
	}
}

describe(`refinery`, () => {
	it(`refines a Set`, () => {
		expect(myRefinery.refine(new Set([1, 2, 3]))).toEqual({
			type: `Set`,
			data: new Set([1, 2, 3]),
		})
	})
	it(`refines a Map`, () => {
		expect(myRefinery.refine(new Map([[`a`, 1]]))).toEqual({
			type: `Map`,
			data: new Map([[`a`, 1]]),
		})
	})
	it(`handles the unknown with grace`, () => {
		expect(myRefinery.refine(1)).toEqual(null)
	})
})
