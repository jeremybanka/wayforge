import { doesExtend } from "../object/refinement"
import { isBoolean, isNumber, isString } from "../primitive"
import {
	isIntersection,
	isUnion,
	mustSatisfyAllOfTheFollowing,
	mustSatisfyOneOfTheFollowing,
} from "."

/* type tests */
const case1 = (i: unknown): void => {
	let input = i
	const isBooleanOrNumber = mustSatisfyOneOfTheFollowing(isBoolean).or(isNumber)
	// @ts-expect-error booleans can't be incremented
	if (isBooleanOrNumber(input)) input++
}

describe(`couldBe`, () => {
	it(`allows union of boolean and number`, () => {
		console.log({ isBoolean })
		const isBooleanOrNumber = isUnion.or(isBoolean).or(isNumber)
		expect(isBooleanOrNumber(true)).toBe(true)
		expect(isBooleanOrNumber(1)).toBe(true)
		expect(isBooleanOrNumber(``)).toBe(false)
	})
})

describe(`mustBe`, () => {
	it(`allows intersection of boolean and number, but finds no good cases`, () => {
		const isBooleanAndNumber =
			mustSatisfyAllOfTheFollowing(isBoolean).and(isNumber)
		expect(isBooleanAndNumber(true)).toBe(false)
		expect(isBooleanAndNumber(1)).toBe(false)
	})
	it(`permits object extension`, () => {
		const hasFooAndBar = isIntersection
			.and(doesExtend({ foo: isBoolean }))
			.and(doesExtend({ bar: isNumber }))
		expect(hasFooAndBar({ foo: true, bar: 1 })).toBe(true)
		expect(hasFooAndBar({ foo: true, bar: `1` })).toBe(false)
		expect(hasFooAndBar({ foo: true })).toBe(false)
		expect(hasFooAndBar({ bar: 1 })).toBe(false)
	})
})

describe(`couldBe+mustBe integration`, () => {
	it(`allows an object to be extended in two possible ways`, () => {
		const hasFooAndEitherBarOrBaz = isIntersection
			.and(doesExtend({ yes: isBoolean }))
			.and(
				isUnion
					.or(doesExtend({ num: isNumber }))
					.or(doesExtend({ str: isString })),
			)

		expect(hasFooAndEitherBarOrBaz({ yes: true, num: 1, str: `1` })).toBe(true)
		expect(hasFooAndEitherBarOrBaz({ yes: true, num: 1 })).toBe(true)
		expect(hasFooAndEitherBarOrBaz({ yes: true, str: `1` })).toBe(true)
		expect(hasFooAndEitherBarOrBaz({ foo: true, bar: `1` })).toBe(false)
		expect(hasFooAndEitherBarOrBaz({ foo: true })).toBe(false)
		expect(hasFooAndEitherBarOrBaz({ bar: 1 })).toBe(false)
	})
})
