import type {
	Join,
	ToPath,
	Tree,
	TreeMap,
	TreePath,
	TreePathName,
} from "../src/treetrunks"
import { isTreePath, optional, required } from "../src/treetrunks"

test(`treetrunks`, () => {
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

const myWebRoutes = optional({
	documents: null,
}) satisfies Tree

type HttpInterface = { query: Record<string, string>; response: string }
type HttpSignalMethod = `DELETE` | `GET`
type HttpVectorMethod = `GET` | `PATCH` | `POST` | `PUT`
type HttpMethod = HttpSignalMethod | HttpVectorMethod
type WebIO<M extends HttpMethod> = M extends HttpSignalMethod
	? HttpInterface
	: HttpInterface & { body: string }

type WebApiRouteDescriptor = Partial<{ [M in HttpMethod]: WebIO<M> }>

type WebApi<Routes extends Tree> = TreeMap<Routes, WebApiRouteDescriptor>

const none: Readonly<Record<never, never>> = {}

const WEB_ROUTES = {
	"": {
		GET: {
			query: none,
			response: `Hello World`,
		},
	},
	documents: {},
} satisfies WebApi<typeof myWebRoutes>
