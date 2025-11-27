import type {
	Distill,
	LastInUnion,
	MergeTrees,
	ReduceTrees,
	Tree,
	TreeMap,
	TreeMapExhaustive,
} from "../src/treetrunks.ts"
import { optional, required } from "../src/treetrunks.ts"

describe(`experiments`, () => {
	test(`web routes`, () => {
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

		const _WEB_ROUTES = {
			"": {
				GET: {
					query: none,
					response: `Hello World`,
				},
			},
			documents: {},
		} satisfies WebApi<typeof myWebRoutes>
	})
	test(`render tree`, () => {
		const _myRenderTree = required({
			body: required({
				header: required({
					nav: required({
						ul: required({
							li: required({
								a: required({}),
							}),
						}),
					}),
				}),
				main: required({
					section: null,
				}),
			}),
		}) satisfies Tree

		type VNode<T extends Tree> = { render(): string; tree?: T }
		type ComponentFn<N extends VNode<any>> = (
			...params: any[]
		) => N | string | null

		type TreeFromVNode<N extends VNode<any> | string | null> =
			N extends VNode<infer T> ? T : null

		type TreesFromComponentFn<F extends ComponentFn<any>> =
			F extends ComponentFn<infer N> ? TreeFromVNode<N> : never

		function div<N extends VNode<any> | string | null>(
			_: N,
		): {
			render(): string
			tree?: [
				`required`,
				{
					div: TreeFromVNode<N>
				},
			]
		} {
			return { render: () => `` }
		}
		function span<N extends VNode<any> | string | null>(
			_: N,
		): {
			render(): string
			tree?: [
				`required`,
				{
					span: TreeFromVNode<N>
				},
			]
		} {
			return { render: () => `` }
		}

		function myComponent() {
			if (Math.random() > 0.5) {
				return span(`hi`)
			}
			return div(span(`hi`))
		}

		const treeA = optional({
			a: required({
				b: null,
			}),
		})
		const treeB = optional({
			a: required({
				c: null,
				d: optional({
					e: null,
				}),
			}),
			z: null,
		})

		type _MergedTree = MergeTrees<typeof treeA, typeof treeB>

		type _Z = LastInUnion<1 | 2>

		type _ZZ = Distill<1 | 2 | 3>

		type ComponentTree<F extends ComponentFn<any>> =
			Distill<TreesFromComponentFn<F>> extends Tree[]
				? ReduceTrees<Distill<TreesFromComponentFn<F>>> extends Tree
					? ReduceTrees<Distill<TreesFromComponentFn<F>>>
					: never
				: never

		type _ComponentTrees = Distill<TreesFromComponentFn<typeof myComponent>>

		type ComponentTrees2 = ComponentTree<typeof myComponent>

		type CSSProperties = Record<string, string>

		type _StylesForComponent = Omit<
			TreeMapExhaustive<ComponentTree<typeof myComponent>, CSSProperties, ` > `>,
			``
		>

		type TreeLedger<T extends Tree, P extends string> = {
			[K in keyof T[1] as `${P}${K & string}`]: null
		}

		type _ZZZ = TreeLedger<ComponentTrees2, `> `>
	})
})
