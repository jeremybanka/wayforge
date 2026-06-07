import * as v from "vitest"

import * as canonical from "../../src/json/canonical"

const number10 = 1234567890
const string26 = `abcdefghijklmnopqrstuvwxyz`
const boolean = true
const nullValue = null
const array0: never[] = []
const array10 = [1, 2, 3, 4, 5, 6, 7, 8, 9, 0]
// const array100 = [...Array(100).map((_,i) => i)]

v.describe(`number10`, () => {
	v.bench(`JSON.stringify`, () => {
		JSON.stringify(number10)
	})
	v.bench(`µ.packCanonical`, () => {
		canonical.packCanonical(number10)
	})

	const number10stringified = JSON.stringify(number10)
	const number10packed = canonical.packCanonical(number10)
	v.bench(`JSON.parse`, () => {
		JSON.parse(number10stringified)
	})
	v.bench(`µ.unpackCanonical`, () => {
		canonical.unpackCanonical(number10packed)
	})
})

v.describe(`string26`, () => {
	v.bench(`JSON.stringify`, () => {
		JSON.stringify(string26)
	})
	v.bench(`µ.packCanonical`, () => {
		canonical.packCanonical(string26)
	})

	const string26stringified = JSON.stringify(string26)
	const string26packed = canonical.packCanonical(string26)
	v.bench(`JSON.parse`, () => {
		JSON.parse(string26stringified)
	})
	v.bench(`µ.unpackCanonical`, () => {
		canonical.unpackCanonical(string26packed)
	})
})

v.describe(`boolean`, () => {
	v.bench(`JSON.stringify`, () => {
		JSON.stringify(boolean)
	})
	v.bench(`µ.packCanonical`, () => {
		canonical.packCanonical(boolean)
	})

	const booleanStringified = JSON.stringify(boolean)
	const booleanPacked = canonical.packCanonical(boolean)
	v.bench(`JSON.parse`, () => {
		JSON.parse(booleanStringified)
	})
	v.bench(`µ.unpackCanonical`, () => {
		canonical.unpackCanonical(booleanPacked)
	})
})

v.describe(`nullValue`, () => {
	v.bench(`JSON.stringify`, () => {
		JSON.stringify(nullValue)
	})
	v.bench(`µ.packCanonical`, () => {
		canonical.packCanonical(nullValue)
	})

	const nullValueStringified = JSON.stringify(nullValue)
	const nullValuePacked = canonical.packCanonical(nullValue)
	v.bench(`JSON.parse`, () => {
		JSON.parse(nullValueStringified)
	})
	v.bench(`µ.unpackCanonical`, () => {
		canonical.unpackCanonical(nullValuePacked)
	})
})

v.describe(`array0`, () => {
	v.bench(`JSON.stringify`, () => {
		JSON.stringify(array0)
	})
	v.bench(`µ.packCanonical`, () => {
		canonical.packCanonical(array0)
	})

	const array0Stringified = JSON.stringify(array0)
	const array0Packed = canonical.packCanonical(array0)
	v.bench(`JSON.parse`, () => {
		JSON.parse(array0Stringified)
	})
	v.bench(`µ.unpackCanonical`, () => {
		canonical.unpackCanonical(array0Packed)
	})
})

v.describe(`array10`, () => {
	v.bench(`JSON.stringify`, () => {
		JSON.stringify(array10)
	})
	v.bench(`µ.packCanonical`, () => {
		canonical.packCanonical(array10)
	})

	const array10Stringified = JSON.stringify(array10)
	const array10Packed = canonical.packCanonical(array10)
	v.bench(`JSON.parse`, () => {
		JSON.parse(array10Stringified)
	})
	v.bench(`µ.unpackCanonical`, () => {
		canonical.unpackCanonical(array10Packed)
	})
})
