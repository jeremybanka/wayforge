import type { InspectOptions } from "node:util"
import { inspect } from "node:util"

import type {
	Deref,
	Distill,
	Join,
	MergeTrees,
	ReduceTrees,
	Split,
	Tree,
	TreeMap,
	TreePath,
	TreePathName,
} from "../src/treetrunks.ts"
import {
	flattenTree,
	isTreePath,
	mapTree,
	mergeTrees,
	optional,
	reduceTrees,
	required,
} from "../src/treetrunks.ts"

describe(`utility types`, () => {
	test(`path reassembly`, () => {
		type Greeting = `hello/$name/good/morning`
		type GreetingSplit = Split<Greeting, `/`>
		;[`hello`, `$name`, `good`, `morning`] satisfies GreetingSplit
		type GreetingDereferenced = Deref<GreetingSplit, `$`>
		;[`hello`, `jeremybanka`, `good`, `morning`] satisfies GreetingDereferenced
		type GreetingRejoined = Join<GreetingDereferenced, `/`>
		;`hello/jeremybanka/good/morning` satisfies GreetingRejoined
	})
	test(`union distillation`, () => {
		type Union = 1 | 2 | 3 | 4
		type Distilled = Distill<Union>
		;[1, 2, 3, 4] satisfies Distilled
	})
})

describe(`paths`, () => {
	const greetings = required({
		hello: optional({
			world: null,
			$name: optional({ good: required({ morning: null }) }),
		}),
	}) satisfies Tree

	test(`types`, () => {
		type MyTreePathName = TreePathName<typeof greetings>
		;[`hello`] satisfies MyTreePathName
		;[`hello`, `world`] satisfies MyTreePathName
		;[`hello`, `$name`, `good`, `morning`] satisfies MyTreePathName
		type MyTreePath = TreePath<typeof greetings>
		;[`hello`] satisfies MyTreePath
		;[`hello`, `world`] satisfies MyTreePath
		;[`hello`, `treetrunks`, `good`, `morning`] satisfies MyTreePath
	})

	test(`isTreePath`, () => {
		expect(isTreePath(greetings, [`hello`, `world`])).toBe(true)
		expect(isTreePath(greetings, [`hello`, `jo`, `good`, `morning`])).toBe(true)
		expect(isTreePath(greetings, [`hello`])).toBe(true)

		expect(isTreePath(greetings, [`hello`, `jo`, `good`])).toBe(false)
		expect(isTreePath(greetings, [`hello`, `jo`, `bad`])).toBe(false)
		expect(isTreePath(greetings, [`hello`, `jo`, `good`, `morning`, ``])).toBe(
			false,
		)
		expect(isTreePath(greetings, [])).toBe(false)
		expect(isTreePath(greetings, [1234])).toBe(false)

		expect(isTreePath(greetings, [`hello`, `world`, `good`])).toBe(false)
		expect(isTreePath(greetings, [`hello`, `world`, `good`, `morning`])).toBe(
			true,
		)
	})
	test(`isTreePath - optional root`, () => {
		const tree = optional({ a: null }) satisfies Tree
		expect(isTreePath(tree, [`a`])).toBe(true)
		expect(isTreePath(tree, [`b`])).toBe(false)
		expect(isTreePath(tree, [])).toBe(true)
	})
})

test(`mergeTrees`, () => {
	const treeA = optional({
		a: required({
			bb: null,
		}),
		x: null,
	})
	const treeB = optional({
		a: required({
			cc: null,
			dd: optional({
				eee: null,
			}),
		}),
		x: required({
			y: null,
		}),
		z: null,
	})

	type MergedTree = MergeTrees<typeof treeA, typeof treeB>

	const mergedTreeTarget = optional({
		a: required({
			bb: null,
			cc: null,
			dd: optional({
				eee: null,
			}),
		}),
		x: required({
			y: null,
		}),
		z: null,
	}) satisfies MergedTree
	const mergedTreeActual = mergeTrees(treeA, treeB)

	const DO = false
	if (DO) {
		console.log(`TREE A:`, inspect(treeA, { depth: null, colors: true }))
		console.log(`TREE B:`, inspect(treeB, { depth: null, colors: true }))
		console.log(
			`MERGED TARGET:`,
			inspect(mergedTreeTarget, { depth: null, colors: true }),
		)
		console.log(
			`MERGED ACTUAL:`,
			inspect(mergedTreeActual, { depth: null, colors: true }),
		)
	}

	expect(mergedTreeActual).toEqual(mergedTreeTarget)
})

describe(`reduceTrees`, () => {
	test(`combine zero trees`, () => {
		expect(reduceTrees()).toEqual([`required`, {}])
	})
	test(`combine three trees`, () => {
		const treeA = optional({
			a: required({
				bb: null,
			}),
			x: null,
		})
		const treeB = optional({
			a: required({
				cc: null,
				dd: optional({
					eee: null,
				}),
			}),
			z: null,
		})
		const treeC = optional({
			a: required({
				cc: null,
				dd: optional({
					fff: null,
				}),
			}),
			w: null,
		})

		type ReducedTreeABC = ReduceTrees<[typeof treeA, typeof treeB, typeof treeC]>

		const reducedTreeTarget = optional({
			a: required({
				bb: null,
				cc: null,
				dd: optional({
					eee: null,
					fff: null,
				}),
			}),
			w: null,
			x: null,
			z: null,
		}) satisfies ReducedTreeABC
		const reducedTreeActual = reduceTrees(treeA, treeB, treeC)

		const DO = false
		if (DO) {
			const showAll: InspectOptions = { depth: null, colors: true }
			console.log(`TREE A:`, inspect(treeA, showAll))
			console.log(`TREE B:`, inspect(treeB, showAll))
			console.log(`TREE C:`, inspect(treeC, showAll))
			console.log(`REDUCED TARGET:`, inspect(reducedTreeTarget, showAll))
			console.log(`REDUCED ACTUAL:`, inspect(reducedTreeActual, showAll))
		}

		expect(reducedTreeActual).toEqual(reducedTreeTarget)
	})
})

test(`flattenTree`, () => {
	const sampleTree = optional({
		a: required({
			cc: null,
			dd: required({
				eee: null,
				fff: required({
					gggg: null,
				}),
			}),
		}),
		w: null,
	})

	const flattenedTreeTarget = {
		"": [],
		a_cc: [`a`, `cc`],
		a_dd_eee: [`a`, `dd`, `eee`],
		a_dd_fff_gggg: [`a`, `dd`, `fff`, `gggg`],
		w: [`w`],
	} as const satisfies {
		[K in Join<TreePathName<typeof sampleTree>, `_`>]: Split<K, `_`>
	}
	const flattenTreeActual = flattenTree(sampleTree, `_`)
	expect(flattenTreeActual).toEqual(flattenedTreeTarget)
})

test(`mapTree`, () => {
	const sampleTree = optional({
		a: required({
			cc: null,
			dd: required({
				eee: null,
				fff: required({
					gggg: null,
				}),
			}),
		}),
		w: null,
	})

	const depthMap = (path: TreePathName<typeof sampleTree>): number => path.length

	const mappedTreeTarget = {
		"": 0,
		a_cc: 2,
		a_dd_eee: 3,
		a_dd_fff_gggg: 4,
		w: 1,
	} as const satisfies TreeMap<typeof sampleTree, number, `_`>
	const mappedTreeActual = mapTree(sampleTree, depthMap, `_`)
	expect(mappedTreeActual).toEqual(mappedTreeTarget)
})
