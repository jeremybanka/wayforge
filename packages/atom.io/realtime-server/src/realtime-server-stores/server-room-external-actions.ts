import type { ChildProcessWithoutNullStreams } from "child_process"
import { spawn } from "child_process"

import * as AtomIO from "atom.io"
import type { Loadable } from "atom.io/data"
import type { UserInRoomMeta } from "atom.io/realtime"
import { roomIndex, usersInRooms } from "atom.io/realtime"

export type RoomArguments =
	| [script: string, options: string[]]
	| [script: string]

export const roomArgumentsAtoms = AtomIO.atomFamily<RoomArguments, string>({
	key: `roomArguments`,
	default: [`echo Hello World!`],
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

export const createRoomTX = AtomIO.transaction<
	(
		roomId: string,
		script: string,
		options?: string[],
	) => Loadable<ChildProcessWithoutNullStreams>
>({
	key: `createRoom`,
	do: ({ get, set, find }, roomId, script, options) => {
		const args: RoomArguments = options ? [script, options] : [script]
		const roomArgumentsState = find(roomArgumentsAtoms, roomId)
		set(roomArgumentsState, args)
		set(roomIndex, (s) => s.add(roomId))
		const roomState = find(roomSelectors, roomId)
		const room = get(roomState)
		return room
	},
})
export type CreateRoomIO = AtomIO.TransactionIO<typeof createRoomTX>

export const joinRoomTX = AtomIO.transaction<
	(roomId: string, userId: string, enteredAtEpoch: number) => UserInRoomMeta
>({
	key: `joinRoom`,
	do: (transactors, roomId, userId, enteredAtEpoch) => {
		const meta = { enteredAtEpoch }
		usersInRooms.transact(transactors, ({ relations }) => {
			relations.set(roomId, userId, meta)
		})
		return meta
	},
})
export type JoinRoomIO = AtomIO.TransactionIO<typeof joinRoomTX>

export const leaveRoomTX = AtomIO.transaction<
	(roomId: string, userId: string) => void
>({
	key: `leaveRoom`,
	do: (transactors, roomId, userId) => {
		usersInRooms.transact(transactors, ({ relations }) => {
			relations.delete({ room: roomId, user: userId })
		})
	},
})
export type LeaveRoomIO = AtomIO.TransactionIO<typeof leaveRoomTX>
