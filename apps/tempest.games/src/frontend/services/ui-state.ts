import { atomFamily } from "atom.io"

export const accountPopoverOpenAtoms = atomFamily<boolean, string>({
	key: `accountPopoverOpen`,
	default: false,
})

export const spinnerFrames = [`⠋`, `⠙`, `⠸`, `⠴`, `⠦`, `⠇`]
export const spinnerTextAtoms = atomFamily<string, string>({
	key: `spinnerText`,
	default: spinnerFrames[0],
})

export const loginErrorAtoms = atomFamily<string | null, string>({
	key: `loginError`,
	default: null,
})
export const loginStepAtoms = atomFamily<`email` | `otc` | `password`, string>({
	key: `loginStep`,
	default: `email`,
})
