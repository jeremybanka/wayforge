import "atom.io/react-devtools/css"

import type { Meta, StoryObj } from "@storybook/react-vite"
import type { Loadable } from "atom.io"
import { atom } from "atom.io"
import { IMPLICIT } from "atom.io/internal"
import { AtomIODevtools } from "atom.io/react-devtools"
import { fn } from "storybook/test"

// More on how to set up stories at: https://storybook.js.org/docs/writing-stories#default-export
const meta: Meta<typeof AtomIODevtools> = {
	title: "AtomIODevtools",
	component: AtomIODevtools,
	parameters: {
		// Optional parameter to center the component in the Canvas. More info: https://storybook.js.org/docs/configure/story-layout
		layout: "centered",
	},
	// This component will have an automatically generated Autodocs entry: https://storybook.js.org/docs/writing-docs/autodocs
	tags: ["autodocs"],
	// More on argTypes: https://storybook.js.org/docs/api/argtypes
	argTypes: {
		backgroundColor: { control: "color" },
	},
	// Use `fn` to spy on the onClick arg, which will appear in the actions panel once invoked: https://storybook.js.org/docs/essentials/actions#action-args
	args: { onClick: fn() },
}

export default meta
type Story = StoryObj<typeof meta>

IMPLICIT.STORE.loggers[0].logLevel = "info"
// const countState = atom<number>({
// 	key: "count",
// 	default: 0,
// })
// const nameState = atom<string>({
// 	key: "name",
// 	default: "John Doe",
// })
// const listState = atom<string[]>({
// 	key: "list",
// 	default: ["a", "b", "c"],
// })
// const dictState = atom<Record<string, string>>({
// 	key: "dict",
// 	default: { a: "b", c: "d" },
// })
// const nullState = atom<null>({
// 	key: "null",
// 	default: null,
// })
// const isTrueState = atom<boolean>({
// 	key: "isTrue",
// 	default: true,
// })
const loadableState = atom<Loadable<string>>({
	key: "loadable",
	default: () =>
		new Promise((resolve) =>
			setTimeout(() => {
				resolve("hello")
			}, 1000),
		),
})

// More on writing stories with args: https://storybook.js.org/docs/writing-stories/args
export const Primary: Story = {}
