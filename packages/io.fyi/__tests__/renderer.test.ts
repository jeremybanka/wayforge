import type { Write } from "atom.io"
import { atomFamily } from "atom.io"
import type { Store } from "atom.io/internal"
import {
	createReadonlySelectorFamily,
	createWritableSelector,
	getFromStore,
	IMPLICIT,
} from "atom.io/internal"
import * as Happy from "happy-dom"
import type { Distill, ReduceTrees, Tree } from "treetrunks"

const window = new Happy.Window()

type VNode<T extends Tree> = {
	render: (parent: HTMLElement) => HTMLElement
	tree?: T
}
type ComponentFn<N extends VNode<any>> = (...params: any[]) => N | string | null

type TreeFromVNode<N extends VNode<any> | string | null> = N extends VNode<
	infer T
>
	? T
	: null

type TreesFromComponentFn<F extends ComponentFn<any>> = F extends ComponentFn<
	infer N
>
	? TreeFromVNode<N>
	: never

type ComponentTree<F extends ComponentFn<any>> = Distill<
	TreesFromComponentFn<F>
> extends Tree[]
	? ReduceTrees<Distill<TreesFromComponentFn<F>>> extends Tree
		? ReduceTrees<Distill<TreesFromComponentFn<F>>>
		: never
	: never

type Attributes = Record<string, string>
function useElement(document: Document) {
	const element = <T extends string, N extends VNode<any> | string>(
		tag: T,
		attributes: Attributes,
		children?: N,
	): VNode<[`required`, { [Tag in T]: TreeFromVNode<N> }]> => {
		return {
			render: (parent) => {
				const el = document.createElement(tag)

				for (const [key, value] of Object.entries(attributes)) {
					el.setAttribute(key, value)
				}
				parent.replaceChildren(el)

				if (typeof children === `string`) {
					el.textContent = children
				} else {
					children?.render(el)
				}
				return el
			},
		}
	}

	return {
		element,
	}
}
function useComponent(store: Store) {
	createReadonlySelectorFamily(store, {
		key: `$$__DOM__$$`,
		get: () => () => undefined,
	})

	return {
		component:
			<P extends any[], V extends VNode<any>>(
				render: Write<(...params: P) => V>,
			): ((...params: P) => {
				render(parent: HTMLElement): HTMLElement
				tree?: TreeFromVNode<V>
			}) =>
			(...params: P) => {
				const selectorKey = `$$__DOM__$$("${render.name}")`
				const token = createWritableSelector(
					store,
					{ key: selectorKey, get: (toolkit) => render(toolkit, ...params) },
					{ key: `$$__DOM__$$`, subKey: `"${render.name}"` },
				)
				return getFromStore(store, token)
			},
	}
}
function useHyper({ element }: ReturnType<typeof useElement>) {
	return {
		div: <N extends VNode<any> | string>(
			attributes: Attributes,
			children?: N,
		): VNode<[`required`, { div: TreeFromVNode<N> }]> => {
			return element(`div`, attributes, children)
		},
		span: <N extends VNode<any> | string>(
			attributes: Attributes,
			children?: N,
		): VNode<[`required`, { span: TreeFromVNode<N> }]> => {
			return element(`span`, attributes, children)
		},
	}
}

test(`element rendering`, () => {
	const document = window.document as unknown as Document

	const { element } = useElement(document)

	element(`div`, { id: `my-div` }).render(document.body)

	expect(document.body.innerHTML).toBe(`<div id="my-div"></div>`)
})
test(`component rendering`, () => {
	const document = window.document as unknown as Document

	const { div, span } = useHyper(useElement(document))
	const { component } = useComponent(IMPLICIT.STORE)

	const countAtoms = atomFamily<number, `count:${string}`>({
		key: `count`,
		default: 0,
	})
	const counter = component(function counter(
		{ get },
		countKey: `count:${string}`,
	) {
		return div({ id: countKey }, span({}, get(countAtoms, countKey).toString()))
	})

	counter(`count:abc`).render(document.body)

	expect(document.body.innerHTML).toBe(
		`<div id="count:abc"><span>0</span></div>`,
	)

	type CounterTree = ComponentTree<typeof counter>
})
