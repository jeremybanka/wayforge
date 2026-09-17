import { expectTypeOf } from "vitest"

import {
	type Deref,
	flattenTree,
	isTreePath,
	type Join,
	mapTree,
	optional,
	required,
	type Tree,
	type TreeMap,
	type TreePath,
	type TreePathCaptures,
	type TreePathName,
} from "../src/treetrunks.ts"

const tree = required({
	add: required({ "$...paths": null }),
	remove: optional({ "$...paths": null }),
	project: required({ $name: required({ "$...paths": null }) }),
})

test(`path membership considers every capture branch`, () => {
	const alternatives = required({
		$first: required({ left: null }),
		$second: required({ right: null }),
	})
	for (const path of [
		[`value`, `left`],
		[`value`, `right`],
	]) {
		expect(isTreePath(alternatives, path)).toBe(true)
	}
	expect(isTreePath(alternatives, [`value`, `missing`])).toBe(false)
})

test(`capture inference preserves alternative paths`, () => {
	const alternatives = required({
		show: required({ $name: null }),
		add: required({ "$...paths": null }),
	})
	type Captures = TreePathCaptures<TreePathName<typeof alternatives>>
	expectTypeOf<Captures>().toEqualTypeOf<
		{ name: string } | { paths: [string, ...string[]] }
	>()
	;({ name: `alice` }) satisfies Captures
	;({ paths: [`a`] }) satisfies Captures
	expectTypeOf<TreePathCaptures<never>>().toEqualTypeOf<never>()
})

test(`joining variadic paths permits the shortest valid path`, () => {
	type Expanded = Join<Deref<[`add`, `$...paths`]>, `/`>
	;`add/a` satisfies Expanded
	;`add/a/b` satisfies Expanded
	;`add/` satisfies Expanded
	// @ts-expect-error A rest capture still requires a segment.
	;`add` satisfies Expanded
	type Paths = Join<TreePath<typeof tree>, `/`>
	;`add/a` satisfies Paths
	;`add/a/b` satisfies Paths
	;`remove` satisfies Paths
	;`remove/a` satisfies Paths
	;`project/web/a` satisfies Paths
	;`project/web/a/b` satisfies Paths
	expectTypeOf<Join<[`a`, `b`], `/`>>().toEqualTypeOf<`a/b`>()
	expectTypeOf<Join<[], `/`>>().toEqualTypeOf<``>()
	type OptionalTail = Join<[`a`, ...string[]], `:`>
	;`a` satisfies OptionalTail
	;`a:b` satisfies OptionalTail
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
		TreePathCaptures<[`project`, `$name`, `$...paths`]>
	>().toEqualTypeOf<{
		name: string
		paths: [string, ...string[]]
	}>()
	expectTypeOf<TreePathCaptures<[`remove`]>>().toEqualTypeOf<{}>()
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

test(`checks paths without imposing named-capture declaration rules`, () => {
	const repeated = required({ $name: required({ $name: null }) })
	const path = [`one`, `two`] satisfies TreePath<typeof repeated>
	expect(isTreePath(repeated, path)).toBe(true)
	expect(isTreePath(repeated, [`one`])).toBe(false)
	expect(isTreePath(repeated, [`one`, 2])).toBe(false)
})

test(`an unrelated branch does not prevent validating a path`, () => {
	const branches = required({
		selected: null,
		other: required({ $name: required({ $name: null }) }),
	})
	expect(isTreePath(branches, [`selected`])).toBe(true)
	expect(isTreePath(branches, [`missing`])).toBe(false)
})
