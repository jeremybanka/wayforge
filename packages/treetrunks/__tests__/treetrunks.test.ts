import type {
	Join,
	Split,
	TreeMap,
	TreePath,
	TreePathName,
} from "../src/treetrunks"
import { isTreePath, optional, required } from "../src/treetrunks"

test(`treetrunks`, () => {
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
