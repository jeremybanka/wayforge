import { atom, getState, selector } from "atom.io"

class UnauthorizedError extends Error {
	public constructor() {
		super(`You must sign in first`)
		this.name = `UnauthorizedError`
	}
}

const authTokenAtom = atom<string | null>({
	key: `authToken`,
	default: null,
})

export const viewerSelector = selector<{ id: string }, UnauthorizedError>({
	key: `viewer`,
	get: ({ get }) => {
		const authToken = get(authTokenAtom)
		if (authToken === null) {
			throw new UnauthorizedError()
		}
		return { id: authToken }
	},
	catch: [UnauthorizedError],
})

const result = getState(viewerSelector)

if (result instanceof UnauthorizedError) {
	console.log(result.message) // -> "You must sign in first"
}
