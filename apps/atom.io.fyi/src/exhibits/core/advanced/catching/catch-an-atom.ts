import { atom, getState } from "atom.io"

class MissingSessionError extends Error {
	public constructor() {
		super(`No active session`)
		this.name = `MissingSessionError`
	}
}

export const currentSessionIdAtom = atom<string, MissingSessionError>({
	key: `currentSessionId`,
	default: () => {
		throw new MissingSessionError()
	},
	catch: [MissingSessionError],
})

const result = getState(currentSessionIdAtom)

if (result instanceof MissingSessionError) {
	console.log(result.message) // -> "No active session"
}
