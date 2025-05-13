import type { ChildProcessWithoutNullStreams } from "node:child_process"
import { spawn } from "node:child_process"

import type {
	Loadable,
	ReadonlyTransientSelectorFamilyToken,
	RegularAtomFamilyToken,
} from "atom.io"
import { atomFamily, selectorFamily } from "atom.io"

import { ChildSocket } from "../ipc-sockets"

export type RoomArguments =
	| [script: string, options: string[]]
	| [script: string]

export const roomArgumentsAtoms: RegularAtomFamilyToken<RoomArguments, string> =
	atomFamily<RoomArguments, string>({
		key: `roomArguments`,
		default: [`echo`, [`Hello World!`]],
	})

export const roomSelectors: ReadonlyTransientSelectorFamilyToken<
	Loadable<ChildSocket<any, any>>,
	string
> = selectorFamily<Loadable<ChildSocket<any, any>>, string>({
	key: `room`,
	get:
		(roomId) =>
		async ({ get, find }) => {
			const argumentsState = find(roomArgumentsAtoms, roomId)
			const args = get(argumentsState)
			const [script, options] = args
			const child = await new Promise<ChildProcessWithoutNullStreams>(
				(resolve) => {
					const room = spawn(script, options, { env: process.env })
					const resolver = (data: Buffer) => {
						if (data.toString() === `ALIVE`) {
							room.stdout.off(`data`, resolver)
							resolve(room)
						}
					}
					room.stdout.on(`data`, resolver)
				},
			)
			return new ChildSocket(child, roomId)
		},
})
