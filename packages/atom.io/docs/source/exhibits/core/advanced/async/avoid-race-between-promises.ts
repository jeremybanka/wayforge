import type { Loadable } from "atom.io"
import { atom, getState, setState } from "atom.io"

export const nameAtom = atom<Loadable<string>>({
	key: `name`,
	default: ``,
})
// resolve in 2 seconds
setState(
	nameAtom,
	new Promise<string>((resolve) =>
		setTimeout(() => {
			resolve(`one`)
		}, 2000),
	),
)
// resolve in 1 second
setState(
	nameAtom,
	new Promise<string>((resolve) =>
		setTimeout(() => {
			resolve(`two`)
		}, 1000),
	),
)
// "two" resolves first
// promise for "one" is set to be ignored
// "one" resolves, but is ignored
await new Promise((resolve) => setTimeout(resolve, 3000))
void getState(nameAtom) // "two"
