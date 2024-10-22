import { readFileSync } from "node:fs"
import { resolve } from "node:path"

import { env } from "../src/library/env"

const devDir = resolve(import.meta.dirname, `../dev`)

export const httpsDev = env.VITE_USE_SELF_SIGNED_CERTIFICATE
	? {
			cert: readFileSync(resolve(devDir, `./cert.pem`), `utf-8`),
			key: readFileSync(resolve(devDir, `./key.pem`), `utf-8`),
		}
	: undefined
