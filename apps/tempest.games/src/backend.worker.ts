import { spawn } from "node:child_process"
import { resolve } from "node:path"

import { ChildSocket } from "atom.io/realtime-server"

export type Role = `backend` | `frontend`
export type Mode = `development` | `production`
export type Extension = `js` | `ts`
export type Runner = `bun` | `node`

export function worker(
	name: `${Role}.worker.${string}.${Runner}`,
): ChildSocket<any, any> {
	const isDev = process.env.MODE === `development`
	const extension: Extension = isDev ? `ts` : `js`
	const runner: Runner = name.endsWith(`.bun`) ? `bun` : `node`
	const workerPath = resolve(import.meta.dir, `${name}.${extension}`)
	const args: string[] = [workerPath]
	if (runner === `node` && extension === `ts`) {
		args.push(`--experimental-strip-types`)
	}
	const child = spawn(runner, args)
	return new ChildSocket(child, name, console)
}
