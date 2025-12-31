import { exec } from "node:child_process"
import { readFileSync } from "node:fs"
import type { RequestListener, Server } from "node:http"
import { createServer as createHttpServer } from "node:http"
import { createServer as createSecureServer } from "node:https"
import { resolve } from "node:path"
import { promisify } from "node:util"

const execAsync = promisify(exec)

import { env } from "../src/library/env"

const devDir = resolve(import.meta.dirname, `../dev`)

const localHostName = (
	await execAsync(`scutil --get LocalHostName`)
).stdout.trim()

const bonjourName = `${localHostName}.local`

export const httpsDev = env.VITE_DEV_HTTPS
	? {
			cert: readFileSync(resolve(devDir, `${bonjourName}.pem`), `utf-8`),
			key: readFileSync(resolve(devDir, `${bonjourName}-key.pem`), `utf-8`),
		}
	: undefined

export function createServer(listener: RequestListener): Server {
	if (httpsDev) {
		return createSecureServer(httpsDev, listener)
	}
	return createHttpServer({}, listener)
}
