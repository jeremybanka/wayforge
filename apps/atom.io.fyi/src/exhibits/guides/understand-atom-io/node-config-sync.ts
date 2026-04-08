import fs from "node:fs"
import os from "node:os"
import path from "node:path"

import { atom } from "atom.io"

const configFile = path.join(os.homedir(), `.config`, `my-app`, `session.json`)

export const sessionAtom = atom<string | null>({
	key: `session`,
	default: null,
	effects: [
		({ setSelf, onSet }) => {
			if (fs.existsSync(configFile)) {
				setSelf(JSON.parse(fs.readFileSync(configFile, `utf8`)))
			}

			onSet(({ newValue }) => {
				fs.mkdirSync(path.dirname(configFile), { recursive: true })
				fs.writeFileSync(configFile, JSON.stringify(newValue))
			})
		},
	],
})
