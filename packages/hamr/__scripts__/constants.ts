import path from "path"
import url from "url"

const FILEPATH = url.fileURLToPath(import.meta.url)
const DIRNAME = path.dirname(FILEPATH)

export const HAMR_ROOT = path.resolve(DIRNAME, `..`)
export const EXCLUDE_LIST = [`node_modules`, `src`, `dist`, `coverage`]
export const PACKAGE_JSON_PATH = path.join(HAMR_ROOT, `package.json`)
export const TSCONFIG_JSON_PATH = path.join(HAMR_ROOT, `tsconfig.prod.json`)
