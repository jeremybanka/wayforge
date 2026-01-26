import "atom.io/react-devtools/css"

import type { Meta, StoryObj } from "@storybook/react-vite"
import type { Loadable } from "atom.io"
import {
	atom,
	atomFamily,
	findState,
	runTransaction,
	selector,
	transaction,
} from "atom.io"
import { IMPLICIT } from "atom.io/internal"
import { AtomIODevtools } from "atom.io/react-devtools"

// More on how to set up stories at: https://storybook.js.org/docs/writing-stories#default-export
const meta: Meta<typeof AtomIODevtools> = {
	title: "AtomIODevtools",
	component: () => (
		<>
			<button
				style={{ position: "absolute", top: "10px", right: "10px" }}
				type="button"
				onClick={() => {
					console.log("run")
					runTransaction(myTX)({ thing: ["hi"] })
				}}
			>
				run
			</button>
			<AtomIODevtools />
		</>
	),
	parameters: {
		// Optional parameter to center the component in the Canvas. More info: https://storybook.js.org/docs/configure/story-layout
		layout: "centered",
	},
	// This component will have an automatically generated Autodocs entry: https://storybook.js.org/docs/writing-docs/autodocs
	tags: ["autodocs"],
}

export default meta
type Story = StoryObj<typeof meta>

IMPLICIT.STORE.loggers[0].logLevel = "info"
const countAtom = atom<number>({
	key: "count",
	default: 0,
})
atom<string>({
	key: "name",
	default: "John Doe",
})
atom<string[]>({
	key: "list",
	default: ["a", "b", "c"],
})
atom<Record<string, string>>({
	key: "dict",
	default: { a: "b", c: "d" },
})
atom<null>({
	key: "null",
	default: null,
})
atom<boolean>({
	key: "isTrue",
	default: true,
})
atom<Loadable<string>>({
	key: "loadable",
	default: () =>
		new Promise((resolve) =>
			setTimeout(() => {
				resolve("hello")
			}, 1000),
		),
})
atom<Loadable<unknown>>({
	key: "future",
	default: new Promise(() => {}),
})

const countAtoms = atomFamily<number, string>({
	key: "count",
	default: 0,
})
findState(countAtoms, "A")
findState(countAtoms, "B")
findState(countAtoms, "C")
const userAtoms = atomFamily<
	{ name: { first: string; last: string }; stats: Record<string, number> },
	string
>({
	key: "user",
	default: { name: { first: "John", last: "Doe" }, stats: { a: 1, b: 2, c: 3 } },
})
findState(userAtoms, "A")
findState(userAtoms, "B")
findState(userAtoms, "C")

atom<[{ a: number }]>({
	key: "nestArray",
	default: [{ a: 1 }],
})
atom<{ a: number[]; b: { num: number } }>({
	key: "nestObject",
	default: {
		a: [1],
		b: { num: 2 },
	},
})

const selectionsAtom = atom<number[]>({
	key: "selections",
	default: [1, 2, 3],
})
const evenSelectionsSelector = selector<number[]>({
	key: "evenSelections",
	get: ({ get }) => get(selectionsAtom).filter((n) => n % 2 === 0),
})
selector<Record<string, number>>({
	key: "objSelector",
	get: ({ get }) => {
		const selections = get(selectionsAtom)
		const evenSelections = get(evenSelectionsSelector)
		return {
			a: selections[0],
			b: evenSelections[0],
		}
	},
})
const myTX = transaction<(param: object) => object>({
	key: "myTX",
	do: ({ set }) => {
		set(countAtom, 0)
		set(selectionsAtom, (prev) => [...prev, 4])
		return {
			a: 1,
			b: 2,
			c: { stuff: [1, 2, 3] },
		}
	},
})

// More on writing stories with args: https://storybook.js.org/docs/writing-stories/args
export const Primary: Story = {
	args: {},
}
