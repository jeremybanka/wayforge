import { atom } from "atom.io"

import { IS_SERVER } from "./env"

export const cpuCountAtom = atom<number>({
	key: `cpuCount`,
	default: 1,
	effects: [
		({ setSelf }) => {
			if (IS_SERVER) {
				void import(`node:os`).then(({ cpus }) => {
					setSelf(cpus().length)
				})
			}
		},
	],
})

export const isAdminAtom = atom<boolean>({
	key: `isAdmin`,
	default: false,
})
