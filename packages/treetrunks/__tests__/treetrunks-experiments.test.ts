import type { Tree, TreeMap, TreeMapExhaustive } from "../src/treetrunks"
import { optional, required } from "../src/treetrunks"

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

		const WEB_ROUTES = {
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
		const myRenderTree = required({
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

		type TreeFromVNode<N extends VNode<any> | string | null> = N extends VNode<
			infer T
		>
			? T
			: null

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
		type Flat<R extends { [K in PropertyKey]: any }> = {
			[K in keyof R]: R[K]
		}

		type MergeTrees<T extends Tree, U extends Tree> = [
			T[0] extends `required`
				? U[0] extends `required`
					? `required`
					: `optional`
				: `optional`,
			Flat<{
				[K in keyof T[1] | keyof U[1]]: K extends keyof T[1]
					? K extends keyof U[1]
						? T[1][K] extends Tree
							? U[1][K] extends Tree
								? Flat<MergeTrees<T[1][K], U[1][K]>>
								: U[1][K]
							: T[1][K]
						: T[1][K]
					: K extends keyof U[1]
						? U[1][K]
						: never
			}>,
		]

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

		type MergedTree = MergeTrees<typeof treeA, typeof treeB>

		type FromUnion<U> = U extends infer T
			? T extends U
				? Exclude<U, T>
				: never
			: never

		// Convert a union to an intersection
		type UnionToIntersection<U> = (
			U extends any
				? (x: U) => void
				: never
		) extends (x: infer I) => void
			? I
			: never

		// Get the “last” element of a union (order is arbitrary)
		type LastInUnion<U> = UnionToIntersection<
			U extends any ? (x: U) => void : never
		> extends (x: infer Last) => void
			? Last
			: never

		type Z = LastInUnion<1 | 2>

		type UnionToTuple<T, Last = LastInUnion<T>> = [T] extends [never]
			? []
			: [...UnionToTuple<Exclude<T, Last>>, Last]

		type ZZ = UnionToTuple<1 | 2 | 3>

		type ReduceTrees<
			Tuple extends Tree[],
			Acc extends MergeTrees<any, any> | Tree = [`required`, {}],
		> = Tuple extends [infer Head, ...infer Rest]
			? Head extends Tree
				? Rest extends Tree[]
					? ReduceTrees<Rest, MergeTrees<Acc, Head>>
					: never
				: never
			: Acc

		type ComponentTree<F extends ComponentFn<any>> = UnionToTuple<
			TreesFromComponentFn<F>
		> extends Tree[]
			? ReduceTrees<UnionToTuple<TreesFromComponentFn<F>>> extends Tree
				? ReduceTrees<UnionToTuple<TreesFromComponentFn<F>>>
				: never
			: never

		type ComponentTrees = UnionToTuple<TreesFromComponentFn<typeof myComponent>>

		type ComponentTrees2 = ComponentTree<typeof myComponent>

		type CSSProperties = Record<string, string>

		type StylesForComponent = Omit<
			TreeMapExhaustive<ComponentTree<typeof myComponent>, CSSProperties, ` > `>,
			``
		>

		type TreeLedger<T extends Tree, P extends string> = {
			[K in keyof T[1] as `${P}${K & string}`]: null
		}

		type ZZZ = TreeLedger<ComponentTrees2, `> `>
	})
})
