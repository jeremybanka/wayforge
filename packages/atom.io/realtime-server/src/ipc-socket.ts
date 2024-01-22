import type { ChildProcessWithoutNullStreams } from "child_process"

import type { Socket } from "."

export function parentIPC(process: ChildProcessWithoutNullStreams): Socket {
	const id = process.pid?.toString()
	if (!id) {
		throw new Error(`Process ID not found`)
	}
	return {
		id,
		on: process.on.bind(process),
		off: process.off.bind(process),
		emit: process.emit.bind(process),
	}
}

export function childIPC(): Socket {
	const id = process.pid?.toString()
	if (!id) {
		throw new Error(`Process ID not found`)
	}
	return {
		id,
		on: process.on.bind(process),
		off: process.off.bind(process),
		emit: process.emit.bind(process),
	}
}
