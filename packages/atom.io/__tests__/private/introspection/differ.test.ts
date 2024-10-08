import { prettyJson } from "atom.io/introspection"

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
	it(`diffs two objects with a changed property`, () => {
		expect(prettyJson.diff({ a: 1 }, { a: 2 })).toEqual({
			summary: `～1 ＋0 －0`,
			changed: [[`a`, { summary: `+1 (1 → 2)` }]],
			added: [],
			removed: [],
		})
	})
	it(`diffs two objects with an added property`, () => {
		expect(prettyJson.diff({ a: 1 }, { a: 1, b: 2 })).toEqual({
			summary: `～0 ＋1 －0`,
			changed: [],
			added: [[`b`, `2`]],
			removed: [],
		})
	})
	it(`diffs two objects with a removed property`, () => {
		expect(prettyJson.diff({ a: 1, b: 2 }, { a: 1 })).toEqual({
			summary: `～0 ＋0 －1`,
			changed: [],
			added: [],
			removed: [[`b`, `2`]],
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
	it(`handles an unregistered type`, () => {
		expect(prettyJson.diff(new Map(), new Map())).toEqual({
			summary: `Map → Map`,
		})
	})
	it(`handles a change of type`, () => {
		expect(prettyJson.diff(new Map(), new Set())).toEqual({
			summary: `Type change: Map → Set`,
		})
	})
})
