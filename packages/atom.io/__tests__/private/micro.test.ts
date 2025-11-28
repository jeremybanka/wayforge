import * as µ from "atom.io/struct/micro"

describe(`packValue`, () => {
	const number10 = 1234567890
	const string26 = `abcdefghijklmnopqrstuvwxyz`
	const boolean = true
	const nullValue = null
	const array0: never[] = []
	const array10 = [1, 2, 3, 4, 5, 6, 7, 8, 9, 0]
	for (const value of [
		number10,
		string26,
		boolean,
		nullValue,
		array0,
		array10,
	]) {
		test(`packValue(${JSON.stringify(value)})`, () => {
			expect(µ.unpackValue(µ.packValue(value))).toEqual(value)
		})
	}
})
