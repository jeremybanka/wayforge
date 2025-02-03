import { existsSync } from "node:fs"
import { resolve } from "node:path"

import cachedir from "cachedir"
import { FilesystemStorage } from "safedeposit"

import { sanitizeFilename } from "./sanitize-filename"

const GLOBAL_CACHE_FOLDER = cachedir(`varmint`)
const CACHE_FOLDER = resolve(
	GLOBAL_CACHE_FOLDER,
	sanitizeFilename(process.cwd()),
)

export type FilesTouched = Record<`file__${string}`, `true`>
export type ListsTouched = Record<`list__${string}`, `true`>
export type RootsTouched = Record<`root__${string}`, string>

export type VarmintFileSystemState = FilesTouched & ListsTouched & RootsTouched

export const storage = new FilesystemStorage<VarmintFileSystemState>({
	path: CACHE_FOLDER,
	eagerInit: false,
})
