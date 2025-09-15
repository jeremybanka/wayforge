import * as v from "vitest"

v.describe(`is stringified integer`, () => {
	let ints: `${number}`[] = []
	for (let i = 0; i < 100; i++) {
		ints.push(`${i}`)
	}
	v.bench(`regex /^\d+$/.test(prop)`, () => {
		for (const int of ints) /^\d+$/.test(int)
	})
	v.bench(`parseInt(prop, 10)`, () => {
		for (const int of ints) !Number.isNaN(Number.parseInt(int, 10))
	})
	v.bench(`Number(prop)`, () => {
		for (const int of ints) !Number.isNaN(Number(int))
	})
})
