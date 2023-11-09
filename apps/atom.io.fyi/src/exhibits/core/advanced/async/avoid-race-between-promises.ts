import { atom, getState, setState } from "atom.io"
import { Loadable } from "atom.io/internal"

export const nameState = atom<Loadable<string>>({
	key: `name`,
	default: ``,
})
// resolve in 2 seconds
setState(
	nameState,
	new Promise<string>((resolve) => setTimeout(() => resolve(`one`), 2000)),
)
// resolve in 1 second
setState(
	nameState,
	new Promise<string>((resolve) => setTimeout(() => resolve(`two`), 1000)),
)
// "two" resolves first
// promise for "one" is set to be ignored
// "one" resolves, but is ignored
await new Promise((resolve) => setTimeout(resolve, 3000))
getState(nameState) // "two"
