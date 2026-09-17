import { expectTypeOf } from "vitest"

import {
	type Deref,
	flattenTree,
	isTreePath,
	mapTree,
	optional,
	required,
	type Tree,
	type TreeMap,
	type TreePath,
	type TreePathName,
	type TreePathParams,
	validateTreeCaptures,
} from "../src/treetrunks.ts"

const tree = required({
	add: required({ "$...paths": null }),
	remove: optional({ "$...paths": null }),
	project: required({ $name: required({ "$...paths": null }) }),
})

test(`variadic paths require at least one string when the rest branch is selected`, () => {
	expectTypeOf<[]>().toExtend<TreePath<Tree>>()
	expectTypeOf<TreePath<typeof tree>>().toEqualTypeOf<
		| [`add`, string & {}, ...string[]]
		| [`remove`]
		| [`remove`, string & {}, ...string[]]
		| [`project`, string & {}, string & {}, ...string[]]
	>()
	expectTypeOf<Deref<[`project`, `$name`, `$...paths`]>>().toEqualTypeOf<
		[`project`, string & {}, string & {}, ...string[]]
	>()
	expectTypeOf<
		TreePathParams<[`project`, `$name`, `$...paths`]>
	>().toEqualTypeOf<{
		name: string
		paths: [string, ...string[]]
	}>()
	expectTypeOf<TreePathParams<[`remove`]>>().toEqualTypeOf<{}>()
})

test.each([
	{ path: [], valid: false },
	{ path: [`add`], valid: false },
	{ path: [`add`, ``], valid: true },
	{ path: [`add`, `one`], valid: true },
	{ path: [`add`, `one`, `two`, `three`], valid: true },
	{ path: [`remove`], valid: true },
	{ path: [`remove`, `one`, `two`], valid: true },
	{ path: [`project`, `web`], valid: false },
	{ path: [`project`, `web`, `one`, `two`], valid: true },
	{ path: [`add`, `one`, 2], valid: false },
	{ path: [`add`, `$...paths`, `two`], valid: true },
	{ path: [`constructor`], valid: false },
])(`validates $path as $valid`, ({ path, valid }) => {
	expect(isTreePath(tree, path)).toBe(valid)
})

test(`flattening and mapping retain the declared rest name once`, () => {
	expectTypeOf<TreePathName<typeof tree>>().toEqualTypeOf<
		| [`add`, `$...paths`]
		| [`remove`]
		| [`remove`, `$...paths`]
		| [`project`, `$name`, `$...paths`]
	>()
	expect(flattenTree(tree)).toEqual({
		"add/$...paths": [`add`, `$...paths`],
		remove: [`remove`],
		"remove/$...paths": [`remove`, `$...paths`],
		"project/$name/$...paths": [`project`, `$name`, `$...paths`],
	})
	const mapped = mapTree(tree, (path): number => path.length)
	expectTypeOf(mapped).toEqualTypeOf<TreeMap<typeof tree, number>>()
	expect(mapped).toEqual({
		"add/$...paths": 2,
		remove: 1,
		"remove/$...paths": 2,
		"project/$name/$...paths": 3,
	})
})

test(`root rest captures follow the same required and optional cardinality`, () => {
	const requiredRoot = required({ "$...words": null })
	const optionalRoot = optional({ "$...words": null })
	expect(isTreePath(requiredRoot, [])).toBe(false)
	expect(isTreePath(optionalRoot, [])).toBe(true)
	expect(isTreePath(requiredRoot, [`one`, `two`])).toBe(true)
	expect(isTreePath(optionalRoot, [`one`, `two`])).toBe(true)
})

test(`rejects malformed captures before validation`, () => {
	const invalid = required({ "$...paths": null, other: null })
	expect(() => {
		validateTreeCaptures(invalid)
	}).toThrow(/rest.*paths/i)
	expect(() => isTreePath(invalid, [`one`, `two`])).toThrow(/rest.*paths/i)
	expect(() => {
		validateTreeCaptures(required({ $name: required({ $name: null }) }))
	}).toThrow(/duplicate.*name/i)
})
