import type { Read } from "atom.io"
import { atom, atomFamily, selector, selectorFamily } from "atom.io"
import type { Store } from "atom.io/internal"
import {
	createReadonlySelector,
	createReadonlySelectorFamily,
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
	const element = <N extends VNode<any> | string>(
		tag: string,
		attributes: Attributes,
		children?: N,
	): VNode<[`required`, { div: TreeFromVNode<N> }]> => {
		return {
			render: (parent) => {
				const el = document.createElement(tag)

				for (const [key, value] of Object.entries(attributes)) {
					el.setAttribute(key, value)
				}
				parent.appendChild(el)

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
		component: <V extends VNode<any>>(
			get: Read<() => V>,
		): {
			render(parent: HTMLElement): HTMLElement
			tree?: [`required`, { div: TreeFromVNode<V> }]
		} => {
			const selectorKey = `$$__DOM__$$("${get.name}")`
			const token = createReadonlySelector(
				store,
				{ key: selectorKey, get },
				{ key: `$$__DOM__$$`, subKey: `"${get.name}"` },
			)
			return getFromStore(store, token)
		},
	}
}

test(`element rendering`, () => {
	const document = window.document as unknown as Document
	document.body.innerHTML = `<div id="app"></div>`

	const { element } = useElement(document)
	console.log(document.body.innerHTML)
	expect(document.body.innerHTML).toBe(`<div id="app"></div>`)

	const app = document.getElementById(`app`)

	assert(app)

	element(`div`, { id: `my-div` }).render(app)

	expect(document.body.innerHTML).toBe(
		`<div id="app"><div id="my-div"></div></div>`,
	)
})
test(`component rendering`, () => {
	const document = window.document as unknown as Document
	document.body.innerHTML = `<div id="app"></div>`

	const { element } = useElement(document)
	const { component } = useComponent(IMPLICIT.STORE)
	console.log(document.body.innerHTML)
	expect(document.body.innerHTML).toBe(`<div id="app"></div>`)

	const app = document.getElementById(`app`)

	assert(app)

	const countAtom = atom<number>({
		key: `count`,
		default: 0,
	})
	const counter = component(({ get }) => {
		return element(`div`, { id: `my-div` }, get(countAtom).toString())
	})

	counter.render(app)

	expect(document.body.innerHTML).toBe(
		`<div id="app"><div id="my-div">0</div></div>`,
	)
})
