import type { InspectOptions } from "node:util"
import { inspect } from "node:util"

import type {
	Join,
	MergeTrees,
	ReduceTrees,
	Split,
	TreeMap,
	TreePath,
	TreePathName,
} from "../src/treetrunks"
import {
	isTreePath,
	mergeTrees,
	optional,
	reduceTrees,
	required,
} from "../src/treetrunks"

test(`isTreePath`, () => {
	type MySplit = Split<`hello/$world/good/morning`>

	const myTree = required({
		hello: optional({
			world: null,
			$name: optional({ good: required({ morning: null }) }),
		}),
	})

	type MyTreePathName = TreePathName<typeof myTree>
	type MyTreePath = TreePath<typeof myTree>
	type MyTreeMap = TreeMap<typeof myTree, null>

	type MyTreePathsJoined = Join<MyTreePath, `/`>

	expect(isTreePath(myTree, [`hello`, `world`])).toBe(true)
	expect(isTreePath(myTree, [`hello`, `jo`, `good`, `morning`])).toBe(true)
	expect(isTreePath(myTree, [`hello`])).toBe(true)

	expect(isTreePath(myTree, [`hello`, `jo`, `good`])).toBe(false)
	expect(isTreePath(myTree, [`hello`, `jo`, `bad`])).toBe(false)
	expect(isTreePath(myTree, [`hello`, `jo`, `good`, `morning`, ``])).toBe(false)
	expect(isTreePath(myTree, [])).toBe(false)
	expect(isTreePath(myTree, [1234])).toBe(false)

	expect(isTreePath(myTree, [`hello`, `world`, `good`])).toBe(false)
	expect(isTreePath(myTree, [`hello`, `world`, `good`, `morning`])).toBe(true)
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

		type ReducedTree = ReduceTrees<[typeof treeA, typeof treeB, typeof treeC]>

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
		}) satisfies ReducedTree
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
