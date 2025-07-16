import fs from "node:fs"
import path from "node:path"

import { EXCLUDE_LIST, HAMR_SRC } from "./constants.ts"

export default function discoverSubmodules(): string[] {
	const folders = fs
		.readdirSync(HAMR_SRC, { withFileTypes: true })
		.filter((dirent) => dirent.isDirectory())
		.filter((dirent) => !EXCLUDE_LIST.includes(dirent.name))
		.flatMap((dirent) => {
			const contents = fs.readdirSync(path.join(HAMR_SRC, dirent.name))
			const isLeaf = contents.includes(`index.ts`)
			return isLeaf
				? dirent.name
				: contents.map((content) => path.join(dirent.name, content))
		})
	return folders
}
