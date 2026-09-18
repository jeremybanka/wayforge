import { expectTypeOf } from "vitest"

import type { ExpandCaptures } from "../src/treetrunks.ts"

test(`capture expansion preserves literals and expands ordinary and rest captures`, () => {
	expectTypeOf<ExpandCaptures<[]>>().toEqualTypeOf<[]>()
	expectTypeOf<ExpandCaptures<[`one`, `two`]>>().toEqualTypeOf<[`one`, `two`]>()
	expectTypeOf<
		ExpandCaptures<[`literal`, `$name`, `another`, `$...items`]>
	>().toEqualTypeOf<
		[`literal`, string & {}, `another`, string & {}, ...(string & {})[]]
	>()
})

test(`a custom capture prefix is preserved through recursive expansion`, () => {
	expectTypeOf<
		ExpandCaptures<[`literal`, `@name`, `$untouched`, `@...items`], `@`>
	>().toEqualTypeOf<
		[`literal`, string & {}, `$untouched`, string & {}, ...(string & {})[]]
	>()
})

test(`a custom rest marker immediately follows the capture prefix`, () => {
	type Expanded = ExpandCaptures<
		[`literal`, `:name`, `$untouched`, `:...single`, `:**items`],
		`:`,
		`**`
	>
	expectTypeOf<Expanded>().toEqualTypeOf<
		[
			`literal`,
			string & {},
			`$untouched`,
			string & {},
			string & {},
			...(string & {})[],
		]
	>()
	;[`literal`, `name`, `$untouched`, `single`, ``] satisfies Expanded
	// @ts-expect-error A rest capture requires at least one segment.
	;[`literal`, `name`, `$untouched`, `single`] satisfies Expanded
	// @ts-expect-error Every rest element must be a string.
	;[`literal`, `name`, `$untouched`, `single`, `first`, 2] satisfies Expanded
})

test(`capture expansion preserves alternative arrays`, () => {
	expectTypeOf<
		ExpandCaptures<[`one`, `$name`] | [`two`, `$...items`]>
	>().toEqualTypeOf<
		[`one`, string & {}] | [`two`, string & {}, ...(string & {})[]]
	>()
})
