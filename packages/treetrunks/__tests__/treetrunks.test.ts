import type {
	Join,
	ToPath,
	TreeMap,
	TreePath,
	TreePathName,
} from "../src/treetrunks"
import { optional, required } from "../src/treetrunks"

type MySplit = ToPath<`hello/$world/good/morning`, `/`>

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
// type MyTreePathsJoined$ = Join<MyTreePath$, `/`>

test(`treetrunks`, () => {})
