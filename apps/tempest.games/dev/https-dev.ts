import { readFileSync } from "node:fs"
import { resolve } from "node:path"

const devDir = resolve(import.meta.dirname, `../dev`)

export const httpsDev = {
	cert: readFileSync(resolve(devDir, `./cert.pem`), `utf-8`),
	key: readFileSync(resolve(devDir, `./key.pem`), `utf-8`),
}
