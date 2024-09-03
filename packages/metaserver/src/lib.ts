import { homedir } from "node:os"
import { resolve } from "node:path"

import type { Subprocess } from "bun"

import * as Internal from "./internal"

export * from "./start"
export { Internal }

export const SERVICES_DIR = resolve(homedir(), `services`)
export const UPDATES_DIR = resolve(homedir(), `services/.updates`)
export const BACKUPS_DIR = resolve(homedir(), `services/.backups`)

export type ServiceRef = {
	process: Subprocess | null
}

export type RestartRef = {
	restartTimes: number[]
}
