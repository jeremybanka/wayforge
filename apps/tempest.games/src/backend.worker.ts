import { resolve } from "node:path"

import { env } from "./library/env"
import type { Extension, RoomName, Runner } from "./library/room-names"

export function resolveRoomScript(
	name: RoomName,
): [runner: Runner, args: string[]] {
	const extension: Extension = env.RUN_WORKERS_FROM_SOURCE ? `ts` : `js`
	const runner: Runner = name.endsWith(`.bun`) ? `bun` : `node`
	const workerPath = resolve(import.meta.dir, `${name}.${extension}`)
	const args = [workerPath]
	if (env.RUN_WORKERS_FROM_SOURCE) {
		switch (runner) {
			case `bun`:
				args.unshift(`--hot`, `--no-clear-screen`)
				break
			case `node`:
				args.unshift(`--watch`, `--watch-preserve-output`)
				break
		}
	}
	return [runner, args]
}
