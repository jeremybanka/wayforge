import * as v from "vitest"

import * as µ from "../../packages/atom.io/src/struct/micro"

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
	v.bench(`µ.packValue`, () => {
		µ.packValue(number10)
	})

	const number10stringified = JSON.stringify(number10)
	const number10packed = µ.packValue(number10)
	v.bench(`JSON.parse`, () => {
		JSON.parse(number10stringified)
	})
	v.bench(`µ.unpackValue`, () => {
		µ.unpackValue(number10packed)
	})
})

v.describe(`string26`, () => {
	v.bench(`JSON.stringify`, () => {
		JSON.stringify(string26)
	})
	v.bench(`µ.packValue`, () => {
		µ.packValue(string26)
	})

	const string26stringified = JSON.stringify(string26)
	const string26packed = µ.packValue(string26)
	v.bench(`JSON.parse`, () => {
		JSON.parse(string26stringified)
	})
	v.bench(`µ.unpackValue`, () => {
		µ.unpackValue(string26packed)
	})
})

v.describe(`boolean`, () => {
	v.bench(`JSON.stringify`, () => {
		JSON.stringify(boolean)
	})
	v.bench(`µ.packValue`, () => {
		µ.packValue(boolean)
	})

	const booleanStringified = JSON.stringify(boolean)
	const booleanPacked = µ.packValue(boolean)
	v.bench(`JSON.parse`, () => {
		JSON.parse(booleanStringified)
	})
	v.bench(`µ.unpackValue`, () => {
		µ.unpackValue(booleanPacked)
	})
})

v.describe(`nullValue`, () => {
	v.bench(`JSON.stringify`, () => {
		JSON.stringify(nullValue)
	})
	v.bench(`µ.packValue`, () => {
		µ.packValue(nullValue)
	})

	const nullValueStringified = JSON.stringify(nullValue)
	const nullValuePacked = µ.packValue(nullValue)
	v.bench(`JSON.parse`, () => {
		JSON.parse(nullValueStringified)
	})
	v.bench(`µ.unpackValue`, () => {
		µ.unpackValue(nullValuePacked)
	})
})

v.describe(`array0`, () => {
	v.bench(`JSON.stringify`, () => {
		JSON.stringify(array0)
	})
	v.bench(`µ.packValue`, () => {
		µ.packValue(array0)
	})

	const array0Stringified = JSON.stringify(array0)
	const array0Packed = µ.packValue(array0)
	v.bench(`JSON.parse`, () => {
		JSON.parse(array0Stringified)
	})
	v.bench(`µ.unpackValue`, () => {
		µ.unpackValue(array0Packed)
	})
})

v.describe(`array10`, () => {
	v.bench(`JSON.stringify`, () => {
		JSON.stringify(array10)
	})
	v.bench(`µ.packValue`, () => {
		µ.packValue(array10)
	})

	const array10Stringified = JSON.stringify(array10)
	const array10Packed = µ.packValue(array10)
	v.bench(`JSON.parse`, () => {
		JSON.parse(array10Stringified)
	})
	v.bench(`µ.unpackValue`, () => {
		µ.unpackValue(array10Packed)
	})
})
