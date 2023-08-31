import { Refinery } from "../refinement/refinery"
import {
	Differ,
	diffArray,
	diffBoolean,
	diffNumber,
	diffObject,
	diffString,
} from "./differ"

const primitiveRefinery = new Refinery({
	number: (input: unknown): input is number => typeof input === `number`,
	string: (input: unknown): input is string => typeof input === `string`,
	boolean: (input: unknown): input is boolean => typeof input === `boolean`,

	null: (input: unknown): input is null => input === null,
})

const jsonTreeRefinery = new Refinery({
	object: (input: unknown): input is object =>
		typeof input === `object` && input !== null,
	array: (input: unknown): input is unknown[] => Array.isArray(input),
})

const prettyJson = new Differ(primitiveRefinery, jsonTreeRefinery, {
	number: diffNumber,
	string: diffString,
	boolean: diffBoolean,
	null: () => ({ summary: `No Change` }),
	object: diffObject,
	array: diffArray,
})

describe(`differ`, () => {
	it(`diffs two numbers`, () => {
		expect(prettyJson.diff(1, 2)).toEqual({ summary: `+1 (1 → 2)` })
	})
	it(`diffs two strings`, () => {
		expect(prettyJson.diff(`a`, `b`)).toEqual({ summary: `-0 (\"a\" → \"b\")` })
	})
	it(`diffs two booleans`, () => {
		expect(prettyJson.diff(true, false)).toEqual({ summary: `true → false` })
	})
	it(`reports when values have not changed`, () => {
		expect(prettyJson.diff(null, null)).toEqual({ summary: `No Change` })
	})
	it(`diffs two objects`, () => {
		expect(prettyJson.diff({ a: 1 }, { a: 2 })).toEqual({
			summary: `～1 ＋0 －0`,
			changed: [[`a`, { summary: `+1 (1 → 2)` }]],
			added: [],
			removed: [],
		})
	})
	it(`diffs two arrays`, () => {
		expect(prettyJson.diff([1, 2, 3], [1, 2, 3, 4])).toEqual({
			summary: `～0 ＋1 －0`,
			changed: [],
			added: [[3, `4`]],
			removed: [],
		})
	})
})
