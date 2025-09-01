import type { ChildProcessWithoutNullStreams } from "node:child_process"
import { spawn } from "node:child_process"

import { ChildSocket } from "../ipc-sockets"

export const ROOMS: Map<
	string,
	ChildSocket<any, any, ChildProcessWithoutNullStreams>
> = new Map()

export async function spawnRoom(
	roomId: string,
	script: string,
	options: string[],
): Promise<ChildSocket<any, any>> {
	const child = await new Promise<ChildProcessWithoutNullStreams>((resolve) => {
		const room = spawn(script, options, { env: process.env })
		const resolver = (data: Buffer) => {
			if (data.toString() === `ALIVE`) {
				room.stdout.off(`data`, resolver)
				resolve(room)
			}
		}
		room.stdout.on(`data`, resolver)
	})
	ROOMS.set(roomId, new ChildSocket(child, roomId))
	return new ChildSocket(child, roomId)
}

export function deleteRoom(roomId: string): void {
	const room = ROOMS.get(roomId)
	if (room) {
		room.emit(`exit`)
		ROOMS.delete(roomId)
	}
}
