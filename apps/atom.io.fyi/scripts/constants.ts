import path from "node:path"
import url from "node:url"

const FILEPATH = url.fileURLToPath(import.meta.url)
const DIRNAME = path.dirname(FILEPATH)

export const ATOM_IO_FYI_ROOT = path.join(DIRNAME, `..`)
