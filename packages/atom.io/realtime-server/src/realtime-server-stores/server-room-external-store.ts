import type { ChildProcessWithoutNullStreams } from "child_process"
import { spawn } from "child_process"

import * as AtomIO from "atom.io"
import type { Loadable } from "atom.io/data"

export type RoomArguments =
	| [script: string, options: string[]]
	| [script: string]

export const roomArgumentsAtoms = AtomIO.atomFamily<RoomArguments, string>({
	key: `roomArguments`,
	default: [`echo`, [`Hello World!`]],
})

export const roomSelectors = AtomIO.selectorFamily<
	Loadable<ChildProcessWithoutNullStreams>,
	string
>({
	key: `room`,
	get:
		(roomId) =>
		({ get, find }) => {
			const argumentsState = find(roomArgumentsAtoms, roomId)
			const args = get(argumentsState)
			const [script, options] = args
			return new Promise((resolve) => {
				const room = spawn(script, options, { env: process.env })
				const resolver = (data: Buffer) => {
					if (data.toString() === `✨`) {
						room.stdout.off(`data`, resolver)
						resolve(room)
					}
				}
				room.stdout.on(`data`, resolver)
			})
		},
})
