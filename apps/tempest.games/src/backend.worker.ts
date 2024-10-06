import { spawn } from "node:child_process"
import { resolve } from "node:path"

import type { ParentSocket } from "atom.io/realtime-server"
import { ChildSocket } from "atom.io/realtime-server"

import { env } from "./library/env"

export type Role = `backend` | `frontend`
export type Extension = `js` | `ts`
export type Runner = `bun` | `node`

export function worker(
	from: ParentSocket<any, any>,
	name: `${Role}.worker.${string}.${Runner}`,
	logger: Pick<Console, `error` | `info` | `warn`> = from.logger,
): ChildSocket<any, any> {
	const extension: Extension = env.RUN_WORKERS_FROM_SOURCE ? `ts` : `js`
	const runner: Runner = name.endsWith(`.bun`) ? `bun` : `node`
	const workerPath = resolve(import.meta.dir, `${name}.${extension}`)
	const args: string[] = [workerPath]
	if (runner === `node` && extension === `ts`) {
		args.push(`--experimental-strip-types`)
	}
	const child = spawn(runner, args)
	return new ChildSocket(child, name, logger)
}
