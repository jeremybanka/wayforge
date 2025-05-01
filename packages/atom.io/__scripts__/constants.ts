import path from "node:path"
import url from "node:url"

const FILEPATH = url.fileURLToPath(import.meta.url)
const DIRNAME = path.dirname(FILEPATH)

export const ATOM_IO_ROOT: string = path.resolve(DIRNAME, `..`)
export const ATOM_IO_SRC: string = path.join(ATOM_IO_ROOT, `src`)
// export const EXCLUDE_LIST = [`node_modules`, `src`, `dist`, `coverage`] as const
export const PACKAGE_JSON_PATH: string = path.join(ATOM_IO_ROOT, `package.json`)
export const TSCONFIG_JSON_PATH: string = path.join(
	ATOM_IO_ROOT,
	`tsconfig.prod.json`,
)
