import fs from "fs"
import path from "path"
import { ATOM_IO_ROOT, EXCLUDE_LIST } from "./constants"

export default function discoverSubmodules(): string[] {
	const folders = fs
		.readdirSync(ATOM_IO_ROOT, { withFileTypes: true })
		.filter((dirent) => dirent.isDirectory())
		.filter((dirent) => !EXCLUDE_LIST.includes(dirent.name))
		.flatMap((dirent) => {
			const contents = fs.readdirSync(path.join(ATOM_IO_ROOT, dirent.name))
			const isLeaf = contents.includes(`src`)
			return isLeaf
				? dirent.name
				: contents.map((content) => path.join(dirent.name, content))
		})
		.filter(
			(folder) =>
				!EXCLUDE_LIST.includes(folder) &&
				!folder.startsWith(`__`) &&
				!folder.endsWith(`__`) &&
				!folder.startsWith(`.`),
		)

	return folders
}
