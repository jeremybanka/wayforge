import fs from "node:fs"
import path from "node:path"

import { ATOM_IO_SRC } from "./constants.ts"

export default function discoverSubmodules(): string[] {
	const folders = fs
		.readdirSync(ATOM_IO_SRC, { withFileTypes: true })
		.filter((dirent) => dirent.isDirectory())
		.filter((dirent) => dirent.name !== `main`)
		.flatMap((dirent) => {
			const contents = fs.readdirSync(path.join(ATOM_IO_SRC, dirent.name))
			const isLeaf = contents.includes(`index.ts`)
			return isLeaf
				? dirent.name
				: contents.map((content) =>
						path.join(dirent.name, content === `main` ? `` : content),
					)
		})
	return folders
	// 	.filter((dirent) => dirent.isDirectory())
	// 	.filter((dirent) => !EXCLUDE_LIST.includes(dirent.name))
	// 	.flatMap((dirent) => {
	// 		const contents = fs.readdirSync(path.join(ATOM_IO_ROOT, dirent.name))
	// 		const isLeaf = contents.includes(`src`)
	// 		return isLeaf
	// 			? dirent.name
	// 			: contents.map((content) => path.join(dirent.name, content))
	// 	})
	// 	.filter(
	// 		(folder) =>
	// 			!EXCLUDE_LIST.includes(folder) &&
	// 			!folder.startsWith(`__`) &&
	// 			!folder.endsWith(`__`) &&
	// 			!folder.startsWith(`.`),
	// 	)

	// return folders
}
