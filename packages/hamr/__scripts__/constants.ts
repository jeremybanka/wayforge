import path from "node:path"
import url from "node:url"

const FILEPATH = url.fileURLToPath(import.meta.url)
const DIRNAME = path.dirname(FILEPATH)

export const HAMR_ROOT = path.resolve(DIRNAME, `..`)
export const HAMR_SRC = path.resolve(HAMR_ROOT, `src`)
export const EXCLUDE_LIST = [`node_modules`, `src`, `dist`, `coverage`]
export const PACKAGE_JSON_PATH = path.join(HAMR_ROOT, `package.json`)
export const TSCONFIG_JSON_PATH = path.join(HAMR_ROOT, `tsconfig.prod.json`)
