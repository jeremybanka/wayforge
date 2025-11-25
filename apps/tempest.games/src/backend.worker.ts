import type { ChildProcessWithoutNullStreams } from "node:child_process"
import { spawn } from "node:child_process"
import { resolve } from "node:path"

import type { ParentSocket } from "atom.io/realtime-server"
import { ChildSocket } from "atom.io/realtime-server"

import { env } from "./library/env"

export type Role = `backend` | `frontend`
export type Extension = `js` | `ts`
export type Runner = `bun` | `node`
export type WorkerName = `${Role}.worker.${string}.${Runner}`

export function worker(
	from: ParentSocket<any, any>,
	name: WorkerName,
	logger: Pick<Console, `error` | `info` | `warn`> = from.logger,
): ChildSocket<any, any, ChildProcessWithoutNullStreams> {
	const [runner, args] = resolveWorker(name)
	const child = spawn(runner, args)
	return new ChildSocket(child, name, logger)
}

export function resolveWorker(
	name: WorkerName,
): [runner: Runner, args: string[]] {
	const extension: Extension = env.RUN_WORKERS_FROM_SOURCE ? `ts` : `js`
	const runner: Runner = name.endsWith(`.bun`) ? `bun` : `node`
	const workerPath = resolve(import.meta.dir, `${name}.${extension}`)
	return [runner, [workerPath]]
}
