import { discoverType, jsonTreeRefinery, Refinery } from "atom.io/introspection"

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

describe(`jsonTreeRefinery`, () => {
	it(`refines an object`, () => {
		expect(jsonTreeRefinery.refine({ a: 1 })).toEqual({
			type: `object`,
			data: { a: 1 },
		})
		expect(jsonTreeRefinery.refine(undefined)).toEqual(null)
	})
})

describe(`discoverType`, () => {
	const discoveredTypes = [
		[`object`, { a: 1 }],
		[`array`, [1, 2, 3]],
		[`boolean`, true],
		[`null`, null],
		[`number`, 1],
		[`string`, `a`],
		[`Set`, new Set([1, 2, 3])],
	] as const
	for (const [type, input] of discoveredTypes) {
		it(`discovers the type of ${input === null ? `` : `${Object.getPrototypeOf(input).constructor.name} `}${JSON.stringify(input)}`, () => {
			expect(discoverType(input)).toEqual(type)
		})
	}
})
